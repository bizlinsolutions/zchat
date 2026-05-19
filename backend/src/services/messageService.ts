import { v4 as uuidv4 } from 'uuid'
import { logger } from '../utils/logger'
import db from './databaseService'
import type { MessageType, MessageStatus, MessageDirection } from '../types/whatsapp'

interface MessageData {
  id?: string
  text: string
  sender?: string
  ts?: number
  timestamp?: number
  wa_id?: string | null
  direction?: MessageDirection | null
  type?: MessageType
  media_url?: string | null
  status?: MessageStatus | null
  metadata?: string | null
  context?: string | null
  referral?: string | null
}

async function getAllMessages(): Promise<MessageData[]> {
  try {
    const messages = await db.getMessages()
    return messages
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error fetching messages', { error: errorMsg })
    throw err
  }
}

async function createMessage(messageData: MessageData): Promise<MessageData> {
  try {
    const message: MessageData = {
      id: messageData.id || uuidv4(),
      text: messageData.text,
      sender: messageData.sender || 'system',
      timestamp: messageData.timestamp || messageData.ts || Math.floor(Date.now() / 1000),
      ts: messageData.ts || Math.floor(Date.now() / 1000),
      wa_id: messageData.wa_id || null,
      direction: messageData.direction || null,
      type: messageData.type || 'text',
      media_url: messageData.media_url || null,
      status: messageData.status || null,
      metadata: messageData.metadata || null,
      context: messageData.context || null,
      referral: messageData.referral || null,
    }
    await db.addMessage(message)
    logger.info('Message created', { 
      id: message.id, 
      sender: message.sender,
      type: message.type,
      direction: message.direction,
    })
    return message
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error creating message', { error: errorMsg, stack: err instanceof Error ? err.stack : '' })
    throw err
  }
}

async function updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
  try {
    // Validate status is one of the allowed values
    const validStatuses: MessageStatus[] = ['sent', 'delivered', 'read', 'failed', 'pending']
    if (!validStatuses.includes(status)) {
      logger.warn('Invalid message status received', { messageId, status })
      return
    }
    
    await db.updateMessageStatus(messageId, status)
    logger.info('Message status updated', { id: messageId, status })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error updating message status', { id: messageId, error: errorMsg, stack: err instanceof Error ? err.stack : '' })
    throw err
  }
}

async function getMessagesBetween(tsFrom?: number, tsTo?: number): Promise<MessageData[]> {
  try {
    const messages = await db.getMessagesBetween(tsFrom, tsTo)
    return messages
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error fetching messages between dates', { error: errorMsg })
    throw err
  }
}

async function getMessagesCount(tsFrom?: number, tsTo?: number): Promise<number> {
  try {
    const count = await db.getMessagesCount(tsFrom, tsTo)
    return count
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error counting messages', { error: errorMsg })
    throw err
  }
}

export const messageService = {
  getAllMessages,
  createMessage,
  updateMessageStatus,
  getMessagesBetween,
  getMessagesCount,
}
