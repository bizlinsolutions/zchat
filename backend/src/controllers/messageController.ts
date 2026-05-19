import { Request, Response } from 'express'
import { messageService } from '../services/messageService'
import { setupService } from '../services/setupService'
import { whatsappService } from '../services/whatsappService'
import { logger } from '../utils/logger'
import { ValidationError } from '../utils/errors'
import { emitMessage } from '../utils/eventEmitter'

async function getAllMessages(req: Request, res: Response): Promise<void> {
  try {
    const messages = await messageService.getAllMessages()
    res.json(messages)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to fetch messages', { error: error.message })
    res.status(500).json({ error: 'Failed to load messages' })
  }
}

async function createMessage(req: Request, res: Response): Promise<void> {
  try {
    const { text, sender } = req.body
    if (!text) {
      throw new ValidationError('Text is required')
    }

    const message = await messageService.createMessage({
      text,
      sender: sender || 'agent',
    })

    res.status(201).json(message)
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message })
      return
    }
    const error = err as Error
    logger.error('Failed to create message', { error: error.message })
    res.status(500).json({ error: 'Failed to save message' })
  }
}

async function sendTextMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, text } = req.body
    if (!to || !text) {
      throw new ValidationError('Recipient (to) and text are required')
    }

    const account = await setupService.getWhatsAppAccount()
    const response = await whatsappService.sendText(account, to, text)
    const waMessageId = response?.messages?.[0]?.id

    const message = await messageService.createMessage({
      id: waMessageId,
      text,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'text',
    })

    emitMessage(message)
    res.status(201).json(message)
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message })
      return
    }
    const error = err as Error
    logger.error('Failed to send message', { error: error.message })
    res.status(500).json({ error: 'Failed to send message' })
  }
}

async function sendMediaMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, mediaUrl, mediaType } = req.body
    if (!to || !mediaUrl) {
      throw new ValidationError('Recipient (to) and mediaUrl are required')
    }

    const account = await setupService.getWhatsAppAccount()
    const response = await whatsappService.sendMedia(account, to, mediaUrl, mediaType || 'image')
    const waMessageId = response?.messages?.[0]?.id

    const message = await messageService.createMessage({
      id: waMessageId,
      text: mediaUrl,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: mediaType || 'image',
      media_url: mediaUrl,
    })

    emitMessage(message)
    res.status(201).json(message)
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message })
      return
    }
    const error = err as Error
    logger.error('Failed to send media', { error: error.message })
    res.status(500).json({ error: 'Failed to send media' })
  }
}

async function sendTemplateMessage(req: Request, res: Response): Promise<void> {
  try {
    const { to, templateName, language, components } = req.body
    if (!to || !templateName) {
      throw new ValidationError('Recipient (to) and templateName are required')
    }

    const account = await setupService.getWhatsAppAccount()
    const response = await whatsappService.sendTemplate(
      account,
      to,
      templateName,
      language || 'en_US',
      components || []
    )
    const waMessageId = response?.messages?.[0]?.id

    const message = await messageService.createMessage({
      id: waMessageId,
      text: `[template:${templateName}]`,
      sender: 'us',
      wa_id: to,
      direction: 'outbound',
      type: 'template',
    })

    emitMessage(message)
    res.status(201).json(message)
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message })
      return
    }
    const error = err as Error
    logger.error('Failed to send template', { error: error.message })
    res.status(500).json({ error: 'Failed to send template' })
  }
}

export default {
  getAllMessages,
  createMessage,
  sendTextMessage,
  sendMediaMessage,
  sendTemplateMessage,
}
