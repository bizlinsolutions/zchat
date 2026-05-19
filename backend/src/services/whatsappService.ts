import axios from 'axios'
import { logger } from '../utils/logger'
import { AppError } from '../utils/errors'

interface WhatsAppAccount {
  phone_id: string
  token: string
  api_version?: string
}

interface WhatsAppMessage {
  messaging_product: string
  to: string
  type: string
  text?: { body: string }
  [key: string]: any
}

const API_DEFAULT = 'v15.0'

function makeUrl(apiVersion: string | undefined, phoneId: string): string {
  return `https://graph.facebook.com/${apiVersion || API_DEFAULT}/${phoneId}/messages`
}

async function sendText(account: WhatsAppAccount, to: string, text: string): Promise<any> {
  if (!account || !account.phone_id || !account.token) {
    throw new AppError('WhatsApp account not configured', 400)
  }

  const phoneId = account.phone_id
  const token = account.token
  const apiVersion = account.api_version || API_DEFAULT
  const url = makeUrl(apiVersion, phoneId)
  const body: WhatsAppMessage = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text },
  }

  try {
    const res = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    logger.info('WhatsApp message sent', { to, status: 'sent' })
    return res.data
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Failed to send WhatsApp message', { to, error: errorMsg })
    throw new AppError(`Failed to send message: ${errorMsg}`, 500)
  }
}

async function sendMedia(account: WhatsAppAccount, to: string, mediaUrl: string, mediaType: string = 'image'): Promise<any> {
  if (!account || !account.phone_id || !account.token) {
    throw new AppError('WhatsApp account not configured', 400)
  }

  const phoneId = account.phone_id
  const token = account.token
  const apiVersion = account.api_version || API_DEFAULT
  const url = makeUrl(apiVersion, phoneId)
  const body: WhatsAppMessage = {
    messaging_product: 'whatsapp',
    to,
    type: mediaType,
    [mediaType]: { link: mediaUrl },
  }

  try {
    const res = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    logger.info('WhatsApp media sent', { to, mediaType, status: 'sent' })
    return res.data
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Failed to send WhatsApp media', { to, mediaType, error: errorMsg })
    throw new AppError(`Failed to send media: ${errorMsg}`, 500)
  }
}

async function sendTemplate(
  account: WhatsAppAccount,
  to: string,
  templateName: string,
  language: string = 'en_US',
  components: any[] = []
): Promise<any> {
  if (!account || !account.phone_id || !account.token) {
    throw new AppError('WhatsApp account not configured', 400)
  }

  const phoneId = account.phone_id
  const token = account.token
  const apiVersion = account.api_version || API_DEFAULT
  const url = makeUrl(apiVersion, phoneId)
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components,
    },
  }

  try {
    const res = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    logger.info('WhatsApp template sent', { to, templateName, status: 'sent' })
    return res.data
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Failed to send WhatsApp template', { to, templateName, error: errorMsg })
    throw new AppError(`Failed to send template: ${errorMsg}`, 500)
  }
}

async function getMediaUrl(account: WhatsAppAccount, mediaId: string): Promise<string> {
  if (!account || !account.token) {
    throw new AppError('WhatsApp token not configured', 400)
  }

  const token = account.token
  const apiVersion = account.api_version || API_DEFAULT
  const url = `https://graph.facebook.com/${apiVersion}/${mediaId}`

  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.data && res.data.url
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Failed to fetch media URL', { mediaId, error: errorMsg })
    throw new AppError(`Failed to fetch media URL: ${errorMsg}`, 500)
  }
}

async function testAccount(account: WhatsAppAccount): Promise<{ ok: boolean; body?: any; error?: any }> {
  if (!account || !account.phone_id || !account.token) {
    throw new AppError('phone_id and token required', 400)
  }

  const apiVersion = account.api_version || API_DEFAULT
  const url = `https://graph.facebook.com/${apiVersion}/${account.phone_id}`

  try {
    const res = await axios.get(url, {
      params: { access_token: account.token },
    })
    logger.info('WhatsApp account test successful')
    return { ok: true, body: res.data }
  } catch (err: any) {
    const errorData = err?.response?.data || (err instanceof Error ? { message: err.message } : { message: 'Unknown error' })
    logger.warn('WhatsApp account test failed', { error: errorData })
    return {
      ok: false,
      error: errorData,
    }
  }
}

export const whatsappService = {
  sendText,
  sendMedia,
  sendTemplate,
  getMediaUrl,
  testAccount,
}
