import { Request, Response } from 'express'
import crypto from 'crypto'
import { messageService } from '../services/messageService'
import { setupService } from '../services/setupService'
import { whatsappService } from '../services/whatsappService'
import { v4 as uuidv4 } from 'uuid'
import { config } from '../config/environment'
import { logger } from '../utils/logger'
import { emitMessage, emitStatus } from '../utils/eventEmitter'
import type { WhatsAppMessage, WhatsAppStatus, MessageType, MessageError } from '../types/whatsapp'

async function verifyWebhook(req: Request, res: Response): Promise<void> {
  try {
    const mode = req.query['hub.mode'] as string
    const token = req.query['hub.verify_token'] as string
    const challenge = req.query['hub.challenge'] as string

    if (!mode || !token) {
      res.sendStatus(400)
      return
    }

    if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
      logger.info('Webhook verified successfully')
      res.status(200).send(challenge)
      return
    }

    logger.warn('Webhook verification failed - invalid token')
    res.sendStatus(403)
  } catch (err) {
    const error = err as Error
    logger.error('Webhook verification error', { error: error.message })
    res.sendStatus(400)
  }
}

async function handleWebhook(req: Request, res: Response): Promise<void> {
  try {
    const raw = req.body
    const sig = (req.headers['x-hub-signature-256'] || req.headers['x-hub-signature']) as string
    const phoneIdParam = req.params.phoneId as string | undefined

    // Verify webhook signature if app secret is provided
    if (config.whatsapp.appSecret && sig) {
      try {
        const hmac = crypto.createHmac('sha256', config.whatsapp.appSecret)
        if (Buffer.isBuffer(raw)) {
          hmac.update(raw)
        } else if (typeof raw === 'string') {
          hmac.update(raw)
        } else {
          hmac.update(JSON.stringify(raw))
        }
        const expected = `sha256=${hmac.digest('hex')}`
        if (sig !== expected) {
          logger.warn('Invalid webhook signature')
          res.sendStatus(403)
          return
        }
      } catch (e) {
        logger.warn('Signature verification failed', { error: (e as Error).message })
        res.sendStatus(403)
        return
      }
    }

    let body
    try {
      if (Buffer.isBuffer(raw)) body = JSON.parse(raw.toString())
      else if (typeof raw === 'string') body = JSON.parse(raw)
      else body = raw
    } catch (err) {
      const error = err as Error
      logger.error('Invalid webhook JSON', { error: error.message })
      res.sendStatus(400)
      return
    }

    if (body.object === 'whatsapp_business_account') {
      const account = phoneIdParam ? await setupService.getWhatsAppAccountByPhoneId(phoneIdParam) : await setupService.getWhatsAppAccount()

      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value || {}

          // Handle incoming messages
          if (value.messages && Array.isArray(value.messages)) {
            for (const msg of value.messages) {
              await handleIncomingMessage(msg, value, account)
            }
          }

          // Handle status updates
          if (value.statuses && Array.isArray(value.statuses)) {
            for (const st of value.statuses) {
              await handleStatusUpdate(st)
            }
          }

          // Handle errors
          if (value.errors && Array.isArray(value.errors)) {
            for (const err of value.errors) {
              await handleWebhookError(err, phoneIdParam || '')
            }
          }
        }
      }

      res.sendStatus(200)
    } else {
      res.sendStatus(200)
    }
  } catch (err) {
    const error = err as Error
    logger.error('Webhook handling error', { error: error.message })
    res.sendStatus(500)
  }
}

async function handleIncomingMessage(msg: WhatsAppMessage, value: any, account: any): Promise<void> {
  try {
    const wa_id = msg.from || (value.contacts && value.contacts[0] && value.contacts[0].wa_id)
    const senderName =
      (value.contacts && value.contacts[0] && value.contacts[0].profile && value.contacts[0].profile.name) || wa_id

    let text = ''
    let media_url: string | null = null
    let media_type = msg.type
    const metadata: Record<string, any> = {}

    // Extract message content based on type
    switch (msg.type) {
      case 'text':
        text = msg.text || ''
        if (msg.referral) {
          metadata.referral = msg.referral
        }
        break

      case 'image':
      case 'video':
      case 'document':
      case 'audio':
        const mediaKey = msg.type as 'image' | 'video' | 'document' | 'audio'
        const media = msg[mediaKey]
        if (media?.id) {
          try {
            media_url = await whatsappService.getMediaUrl(account, media.id)
          } catch (e) {
            const error = e as Error
            logger.warn('Failed to fetch media URL', { mediaId: media.id, error: error.message })
          }
          if (media.caption) {
            text = media.caption
          }
          metadata.media = {
            id: media.id,
            mime_type: media.mime_type,
            sha256_hash: media.sha256_hash,
            url: media_url,
            filename: media.filename,
          }
        }
        break

      case 'contacts':
        text = `Shared ${msg.contacts?.length || 0} contact(s)`
        metadata.contacts = msg.contacts
        break

      case 'location':
        if (msg.location) {
          text = msg.location.name || `📍 ${msg.location.latitude}, ${msg.location.longitude}`
          metadata.location = {
            latitude: msg.location.latitude,
            longitude: msg.location.longitude,
            name: msg.location.name,
            address: msg.location.address,
            url: msg.location.url,
          }
        }
        break

      case 'interactive':
        if (msg.interactive?.type === 'button_reply' && msg.interactive.button_reply) {
          text = msg.interactive.button_reply.title || msg.interactive.button_reply.id
          metadata.interaction_type = 'button_reply'
          metadata.interaction_id = msg.interactive.button_reply.id
        } else if (msg.interactive?.type === 'list_reply' && msg.interactive.list_reply) {
          text = msg.interactive.list_reply.title || msg.interactive.list_reply.id
          metadata.interaction_type = 'list_reply'
          metadata.interaction_id = msg.interactive.list_reply.id
          metadata.interaction_description = msg.interactive.list_reply.description
        }
        break

      case 'button':
        if (msg.button) {
          text = msg.button.text || msg.button.payload
          metadata.button_payload = msg.button.payload
        }
        break

      case 'order':
        if (msg.order) {
          const itemsText = msg.order.product_items
            ?.map((item: any) => `${item.quantity}x Product ${item.product_retailer_id}`)
            .join(', ')
          text = `Order: ${itemsText}`
          metadata.order = {
            catalog_id: msg.order.catalog_id,
            products: msg.order.product_items,
            text: msg.order.text,
          }
        }
        break

      case 'reaction':
        if (msg.reaction) {
          text = msg.reaction.emoji ? `Reacted with ${msg.reaction.emoji}` : 'Removed reaction'
          metadata.reaction = {
            message_id: msg.reaction.message_id,
            emoji: msg.reaction.emoji,
          }
        }
        break

      case 'system':
        if (msg.system) {
          text = msg.system.body
          metadata.system = {
            type: msg.system.type,
            wa_id: msg.system.wa_id,
          }
        }
        break

      case 'edit':
        if (msg.edit) {
          text = msg.edit.text || (msg.edit.media ? 'Edited media' : 'Edited message')
          metadata.edit = {
            original_message_id: msg.edit.message_id,
            text: msg.edit.text,
            media: msg.edit.media,
          }
        }
        break

      default:
        text = 'Unsupported message type'
    }

    // Create message record
    const message = await messageService.createMessage({
      id: msg.id || uuidv4(),
      text,
      sender: senderName,
      wa_id,
      direction: 'inbound',
      type: msg.type,
      media_url,
      status: msg.errors && msg.errors.length > 0 ? 'failed' : 'delivered',
      metadata: JSON.stringify(metadata),
      timestamp: parseInt(msg.timestamp || String(Date.now() / 1000)),
      context: msg.context ? JSON.stringify(msg.context) : undefined,
      referral: msg.referral ? JSON.stringify(msg.referral) : undefined,
    })

    emitMessage(message)
    logger.info('Incoming message processed', { wa_id, type: msg.type, messageId: msg.id })
  } catch (err) {
    const error = err as Error
    logger.error('Error processing incoming message', { error: error.message, stack: error.stack })
  }
}

async function handleStatusUpdate(st: WhatsAppStatus): Promise<void> {
  try {
    const msgId = st.id
    const status = st.status

    if (msgId) {
      await messageService.updateMessageStatus(msgId, status)
      
      // Emit status update with metadata
      emitStatus(msgId, status)
      
      logger.info('Message status updated via webhook', { 
        id: msgId, 
        status,
        recipient: st.recipient_id,
        conversation_id: st.conversation?.id,
        billable: st.pricing?.billable,
      })
    }
  } catch (err) {
    const error = err as Error
    logger.error('Error handling status update', { error: error.message, stack: error.stack })
  }
}

async function handleWebhookError(error: MessageError, phoneId: string): Promise<void> {
  try {
    logger.error('WhatsApp webhook error', {
      code: error.code,
      title: error.title,
      message: error.message,
      details: error.error_data?.details,
      phoneId,
    })

    // Log to database or monitoring system if needed
    // Could be rate limiting, authentication issues, etc.
  } catch (err) {
    const e = err as Error
    logger.error('Error handling webhook error', { error: e.message })
  }
}

export default {
  verifyWebhook,
  handleWebhook,
}
