import { Request, Response } from 'express'
import { whatsappSendService } from '../services/whatsappSendService'
import { messageService } from '../services/messageService'
import { emitMessage } from '../utils/eventEmitter'
import { logger } from '../utils/logger'

/**
 * Send text message
 * POST /api/messages/send-text
 */
export async function sendTextMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, text, previewUrl } = req.body

    if (!to || !text) {
      res.status(400).json({ error: 'Missing required fields: to, text' })
      return
    }

    const response = await whatsappSendService.sendText(to, text, previewUrl)
    const msgId = response.messages[0].id

    // Store in database
    const message = await messageService.createMessage({
      id: msgId,
      text,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'text',
      status: 'sent',
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send text message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send image message
 * POST /api/messages/send-image
 */
export async function sendImageMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, mediaId, mediaUrl, caption } = req.body

    if (!to) {
      res.status(400).json({ error: 'Missing required field: to' })
      return
    }

    if (!mediaId && !mediaUrl) {
      res.status(400).json({ error: 'Either mediaId or mediaUrl is required' })
      return
    }

    const response = await whatsappSendService.sendImage(to, mediaId, mediaUrl, caption)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text: caption || '[Image]',
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'image',
      media_url: mediaUrl || mediaId,
      status: 'sent',
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send image message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send video message
 * POST /api/messages/send-video
 */
export async function sendVideoMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, mediaId, mediaUrl, caption } = req.body

    if (!to) {
      res.status(400).json({ error: 'Missing required field: to' })
      return
    }

    if (!mediaId && !mediaUrl) {
      res.status(400).json({ error: 'Either mediaId or mediaUrl is required' })
      return
    }

    const response = await whatsappSendService.sendVideo(to, mediaId, mediaUrl, caption)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text: caption || '[Video]',
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'video',
      media_url: mediaUrl || mediaId,
      status: 'sent',
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send video message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send audio message
 * POST /api/messages/send-audio
 */
export async function sendAudioMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, mediaId, mediaUrl } = req.body

    if (!to) {
      res.status(400).json({ error: 'Missing required field: to' })
      return
    }

    if (!mediaId && !mediaUrl) {
      res.status(400).json({ error: 'Either mediaId or mediaUrl is required' })
      return
    }

    const response = await whatsappSendService.sendAudio(to, mediaId, mediaUrl)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text: '[Audio]',
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'audio',
      media_url: mediaUrl || mediaId,
      status: 'sent',
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send audio message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send document message
 * POST /api/messages/send-document
 */
export async function sendDocumentMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, mediaId, mediaUrl, filename, caption } = req.body

    if (!to) {
      res.status(400).json({ error: 'Missing required field: to' })
      return
    }

    if (!mediaId && !mediaUrl) {
      res.status(400).json({ error: 'Either mediaId or mediaUrl is required' })
      return
    }

    const response = await whatsappSendService.sendDocument(to, mediaId, mediaUrl, filename, caption)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text: caption || `[Document: ${filename}]`,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'document',
      media_url: mediaUrl || mediaId,
      status: 'sent',
      metadata: JSON.stringify({ filename, mediaId, mediaUrl }),
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send document message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send location message
 * POST /api/messages/send-location
 */
export async function sendLocationMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, latitude, longitude, name, address } = req.body

    if (!to || !latitude || !longitude) {
      res.status(400).json({ error: 'Missing required fields: to, latitude, longitude' })
      return
    }

    const response = await whatsappSendService.sendLocation(to, latitude, longitude, name, address)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text: name || `📍 ${latitude}, ${longitude}`,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'location',
      status: 'sent',
      metadata: JSON.stringify({ latitude, longitude, name, address }),
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send location message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send contacts message
 * POST /api/messages/send-contacts
 */
export async function sendContactsMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, contacts } = req.body

    if (!to || !contacts || !Array.isArray(contacts)) {
      res.status(400).json({ error: 'Missing required fields: to, contacts (array)' })
      return
    }

    const response = await whatsappSendService.sendContacts(to, contacts)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text: `Shared ${contacts.length} contact(s)`,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'contacts',
      status: 'sent',
      metadata: JSON.stringify({ contactCount: contacts.length, contacts }),
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send contacts message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send sticker message
 * POST /api/messages/send-sticker
 */
export async function sendStickerMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, mediaId, mediaUrl } = req.body

    if (!to) {
      res.status(400).json({ error: 'Missing required field: to' })
      return
    }

    if (!mediaId && !mediaUrl) {
      res.status(400).json({ error: 'Either mediaId or mediaUrl is required' })
      return
    }

    const response = await whatsappSendService.sendSticker(to, mediaId, mediaUrl)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text: '[Sticker]',
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'sticker',
      media_url: mediaUrl || mediaId,
      status: 'sent',
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send sticker message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send reaction emoji
 * POST /api/messages/send-reaction
 */
export async function sendReactionMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, messageId, emoji } = req.body

    if (!to || !messageId || !emoji) {
      res.status(400).json({ error: 'Missing required fields: to, messageId, emoji' })
      return
    }

    const response = await whatsappSendService.sendReaction(to, messageId, emoji)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text: emoji,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'reaction',
      status: 'sent',
      metadata: JSON.stringify({ targetMessageId: messageId, emoji }),
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send reaction message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send location request
 * POST /api/messages/send-location-request
 */
export async function sendLocationRequest(req: Request, res: Response): Promise<void> {
  try {
    const { to, text } = req.body

    if (!to || !text) {
      res.status(400).json({ error: 'Missing required fields: to, text' })
      return
    }

    const response = await whatsappSendService.sendLocationRequest(to, text)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'interactive',
      status: 'sent',
      metadata: JSON.stringify({ interactiveType: 'location_request_message' }),
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send location request', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send address message (India only)
 * POST /api/messages/send-address
 */
export async function sendAddressMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, text, countryCode, values, savedAddresses, validationErrors } = req.body

    if (!to || !text || !countryCode) {
      res.status(400).json({ error: 'Missing required fields: to, text, countryCode' })
      return
    }

    const response = await whatsappSendService.sendAddressMessage(
      to,
      text,
      countryCode,
      values,
      savedAddresses,
      validationErrors
    )
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'interactive',
      status: 'sent',
      metadata: JSON.stringify({
        interactiveType: 'address_message',
        countryCode,
        values,
        savedAddresses,
        validationErrors,
      }),
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send address message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send button message
 * POST /api/messages/send-buttons
 */
export async function sendButtonMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, text, buttons } = req.body

    if (!to || !text || !buttons || !Array.isArray(buttons)) {
      res.status(400).json({ error: 'Missing required fields: to, text, buttons (array)' })
      return
    }

    const response = await whatsappSendService.sendButtonMessage(to, text, buttons)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'interactive',
      status: 'sent',
      metadata: JSON.stringify({ interactiveType: 'button', buttonCount: buttons.length, buttons }),
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send button message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send list message
 * POST /api/messages/send-list
 */
export async function sendListMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, text, sections, buttonText } = req.body

    if (!to || !text || !sections || !Array.isArray(sections)) {
      res.status(400).json({ error: 'Missing required fields: to, text, sections (array)' })
      return
    }

    const response = await whatsappSendService.sendListMessage(to, text, sections, buttonText)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'interactive',
      status: 'sent',
      metadata: JSON.stringify({ interactiveType: 'list', sectionCount: sections.length, sections }),
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send list message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Send template message
 * POST /api/messages/send-template
 */
export async function sendTemplateMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, templateName, language, bodyParameters } = req.body

    if (!to || !templateName) {
      res.status(400).json({ error: 'Missing required fields: to, templateName' })
      return
    }

    const response = await whatsappSendService.sendTemplate(to, templateName, language, bodyParameters)
    const msgId = response.messages[0].id

    const message = await messageService.createMessage({
      id: msgId,
      text: `[Template: ${templateName}]`,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'template',
      status: 'sent',
      metadata: JSON.stringify({ templateName, language, bodyParameters }),
    })

    emitMessage(message)
    res.json(response)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to send template message', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}
