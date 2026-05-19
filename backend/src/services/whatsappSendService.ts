import axios, { AxiosError } from 'axios'
import { config } from '../config/environment'
import { logger } from '../utils/logger'

interface SendResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

/**
 * WhatsApp Message Sending Service
 * Implements all message types from official Meta documentation
 */
export const whatsappSendService = {
  /**
   * Send text message with optional link preview
   */
  async sendText(to: string, text: string, previewUrl = false): Promise<SendResponse> {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        body: text,
        preview_url: previewUrl,
      },
    }
    return this._send(payload)
  },

  /**
   * Send image message with optional caption
   * Use mediaId (uploaded) for best performance, or mediaUrl (hosted)
   */
  async sendImage(
    to: string,
    mediaId: string | null,
    mediaUrl: string | null,
    caption?: string
  ): Promise<SendResponse> {
    if (!mediaId && !mediaUrl) {
      throw new Error('Either mediaId or mediaUrl is required')
    }

    const imageObj: any = {}
    if (mediaId) imageObj.id = mediaId
    if (mediaUrl) imageObj.link = mediaUrl
    if (caption) imageObj.caption = caption

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: imageObj,
    }
    return this._send(payload)
  },

  /**
   * Send video message with optional caption
   * Supports H.264 + AAC, 16 MB max
   */
  async sendVideo(
    to: string,
    mediaId: string | null,
    mediaUrl: string | null,
    caption?: string
  ): Promise<SendResponse> {
    if (!mediaId && !mediaUrl) {
      throw new Error('Either mediaId or mediaUrl is required')
    }

    const videoObj: any = {}
    if (mediaId) videoObj.id = mediaId
    if (mediaUrl) videoObj.link = mediaUrl
    if (caption) videoObj.caption = caption

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'video',
      video: videoObj,
    }
    return this._send(payload)
  },

  /**
   * Send audio message
   * No caption support for audio
   */
  async sendAudio(to: string, mediaId: string | null, mediaUrl: string | null): Promise<SendResponse> {
    if (!mediaId && !mediaUrl) {
      throw new Error('Either mediaId or mediaUrl is required')
    }

    const audioObj: any = {}
    if (mediaId) audioObj.id = mediaId
    if (mediaUrl) audioObj.link = mediaUrl

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'audio',
      audio: audioObj,
    }
    return this._send(payload)
  },

  /**
   * Send document message with optional caption and filename
   * Supports PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT (up to 100 MB each)
   */
  async sendDocument(
    to: string,
    mediaId: string | null,
    mediaUrl: string | null,
    filename?: string,
    caption?: string
  ): Promise<SendResponse> {
    if (!mediaId && !mediaUrl) {
      throw new Error('Either mediaId or mediaUrl is required')
    }

    const documentObj: any = {}
    if (mediaId) documentObj.id = mediaId
    if (mediaUrl) documentObj.link = mediaUrl
    if (filename) documentObj.filename = filename
    if (caption) documentObj.caption = caption

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'document',
      document: documentObj,
    }
    return this._send(payload)
  },

  /**
   * Send location message
   * latitude and longitude are required
   */
  async sendLocation(
    to: string,
    latitude: number | string,
    longitude: number | string,
    name?: string,
    address?: string
  ): Promise<SendResponse> {
    const locationObj: any = {
      latitude: String(latitude),
      longitude: String(longitude),
    }
    if (name) locationObj.name = name
    if (address) locationObj.address = address

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'location',
      location: locationObj,
    }
    return this._send(payload)
  },

  /**
   * Send contact(s) message
   * Up to 257 contacts per message (recommended < 5 for usability)
   */
  async sendContacts(to: string, contacts: any[]): Promise<SendResponse> {
    if (!contacts || contacts.length === 0) {
      throw new Error('At least one contact is required')
    }

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'contacts',
      contacts,
    }
    return this._send(payload)
  },

  /**
   * Send sticker message
   * Supports animated (.webp, 500KB) and static (.webp, 100KB) stickers
   */
  async sendSticker(to: string, mediaId: string | null, mediaUrl: string | null): Promise<SendResponse> {
    if (!mediaId && !mediaUrl) {
      throw new Error('Either mediaId or mediaUrl is required')
    }

    const stickerObj: any = {}
    if (mediaId) stickerObj.id = mediaId
    if (mediaUrl) stickerObj.link = mediaUrl

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'sticker',
      sticker: stickerObj,
    }
    return this._send(payload)
  },

  /**
   * Send reaction emoji to a message
   * Only available on messages <= 30 days old
   */
  async sendReaction(to: string, messageId: string, emoji: string): Promise<SendResponse> {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'reaction',
      reaction: {
        message_id: messageId,
        emoji: emoji,
      },
    }
    return this._send(payload)
  },

  /**
   * Send location request (interactive message)
   * Prompts user to share their location
   */
  async sendLocationRequest(to: string, bodyText: string): Promise<SendResponse> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'location_request_message',
        body: {
          text: bodyText,
        },
        action: {
          name: 'send_location',
        },
      },
    }
    return this._send(payload)
  },

  /**
   * Send address message (interactive message - India only)
   * Prompts user to enter/select address
   */
  async sendAddressMessage(
    to: string,
    bodyText: string,
    countryCode: string,
    values?: any,
    savedAddresses?: any[],
    validationErrors?: any
  ): Promise<SendResponse> {
    const actionObj: any = {
      name: 'address_message',
      parameters: {
        country: countryCode,
      },
    }

    if (values) actionObj.parameters.values = values
    if (savedAddresses) actionObj.parameters.saved_addresses = savedAddresses
    if (validationErrors) actionObj.parameters.validation_errors = validationErrors

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'interactive',
      interactive: {
        type: 'address_message',
        body: {
          text: bodyText,
        },
        action: actionObj,
      },
    }
    return this._send(payload)
  },

  /**
   * Send interactive message with buttons
   */
  async sendButtonMessage(to: string, bodyText: string, buttons: any[]): Promise<SendResponse> {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: bodyText,
        },
        action: {
          buttons: buttons,
        },
      },
    }
    return this._send(payload)
  },

  /**
   * Send interactive message with list
   */
  async sendListMessage(to: string, bodyText: string, sections: any[], buttonText = 'Choose'): Promise<SendResponse> {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: bodyText,
        },
        action: {
          button: buttonText,
          sections: sections,
        },
      },
    }
    return this._send(payload)
  },

  /**
   * Send template message
   */
  async sendTemplate(
    to: string,
    templateName: string,
    language = 'en_US',
    bodyParameters?: any[]
  ): Promise<SendResponse> {
    const components: any[] = []

    if (bodyParameters && bodyParameters.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParameters,
      })
    }

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: language,
        },
        ...(components.length > 0 && { components }),
      },
    }
    return this._send(payload)
  },

  /**
   * Internal send method using WhatsApp Cloud API
   */
  async _send(payload: any): Promise<SendResponse> {
    try {
      const phoneNumberId = config.whatsapp.phoneNumberId
      const accessToken = config.whatsapp.accessToken
      const apiVersion = config.whatsapp.apiVersion || 'v25.0'

      const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      logger.info('WhatsApp message sent successfully', {
        to: payload.to,
        type: payload.type,
        messageId: response.data.messages?.[0]?.id,
      })

      return response.data as SendResponse
    } catch (err) {
      const error = err as AxiosError<any>
      const errorData = error.response?.data

      logger.error('Failed to send WhatsApp message', {
        to: payload.to,
        type: payload.type,
        status: error.response?.status,
        errorCode: errorData?.error?.code,
        errorMessage: errorData?.error?.message,
        errorDetails: errorData?.error?.error_data?.details,
      })

      throw new Error(`WhatsApp API error: ${errorData?.error?.message || error.message}`)
    }
  },
}
