/**
 * Message Sending Service for Frontend
 * Client-side implementation for communicating with backend message sending APIs
 * Provides typed methods for sending all WhatsApp message types
 */

export interface SendMessageResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

export interface UploadMediaResponse {
  success: boolean
  mediaId: string
  mimeType: string
  filename: string
  size: number
}

const API_BASE = '/api'

/**
 * Send a text message
 */
export async function sendTextMessage(to: string, text: string, previewUrl = false): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, text, previewUrl }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send text message')
  }

  return response.json()
}

/**
 * Send an image message
 */
export async function sendImageMessage(
  to: string,
  mediaId: string | null,
  mediaUrl: string | null,
  caption?: string
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, mediaId, mediaUrl, caption }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send image message')
  }

  return response.json()
}

/**
 * Send a video message
 */
export async function sendVideoMessage(
  to: string,
  mediaId: string | null,
  mediaUrl: string | null,
  caption?: string
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-video`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, mediaId, mediaUrl, caption }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send video message')
  }

  return response.json()
}

/**
 * Send an audio message
 */
export async function sendAudioMessage(
  to: string,
  mediaId: string | null,
  mediaUrl: string | null
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, mediaId, mediaUrl }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send audio message')
  }

  return response.json()
}

/**
 * Send a document message
 */
export async function sendDocumentMessage(
  to: string,
  mediaId: string | null,
  mediaUrl: string | null,
  filename?: string,
  caption?: string
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-document`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, mediaId, mediaUrl, filename, caption }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send document message')
  }

  return response.json()
}

/**
 * Send a location message
 */
export async function sendLocationMessage(
  to: string,
  latitude: number | string,
  longitude: number | string,
  name?: string,
  address?: string
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, latitude, longitude, name, address }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send location message')
  }

  return response.json()
}

/**
 * Send contacts message
 */
export async function sendContactsMessage(to: string, contacts: any[]): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, contacts }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send contacts message')
  }

  return response.json()
}

/**
 * Send a sticker message
 */
export async function sendStickerMessage(
  to: string,
  mediaId: string | null,
  mediaUrl: string | null
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-sticker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, mediaId, mediaUrl }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send sticker message')
  }

  return response.json()
}

/**
 * Send a reaction emoji
 */
export async function sendReactionMessage(to: string, messageId: string, emoji: string): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-reaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, messageId, emoji }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send reaction message')
  }

  return response.json()
}

/**
 * Send a location request (interactive)
 */
export async function sendLocationRequest(to: string, text: string): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-location-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, text }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send location request')
  }

  return response.json()
}

/**
 * Send an address message (India-only, interactive)
 */
export async function sendAddressMessage(
  to: string,
  text: string,
  countryCode: string,
  values?: any,
  savedAddresses?: any[],
  validationErrors?: any
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-address`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, text, countryCode, values, savedAddresses, validationErrors }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send address message')
  }

  return response.json()
}

/**
 * Send a button message (interactive)
 */
export async function sendButtonMessage(to: string, text: string, buttons: any[]): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-buttons`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, text, buttons }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send button message')
  }

  return response.json()
}

/**
 * Send a list message (interactive)
 */
export async function sendListMessage(
  to: string,
  text: string,
  sections: any[],
  buttonText?: string
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, text, sections, buttonText }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send list message')
  }

  return response.json()
}

/**
 * Send a template message
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  language?: string,
  bodyParameters?: any[]
): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE}/messages/send-template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, templateName, language, bodyParameters }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to send template message')
  }

  return response.json()
}

/**
 * Upload a media file
 */
export async function uploadMedia(file: File, type: 'image' | 'video' | 'audio' | 'document' | 'sticker'): Promise<UploadMediaResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)

  const response = await fetch(`${API_BASE}/media/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload media')
  }

  return response.json()
}

/**
 * Upload media from URL
 */
export async function uploadMediaFromUrl(url: string, type: 'image' | 'video' | 'audio' | 'document' | 'sticker'): Promise<UploadMediaResponse> {
  const response = await fetch(`${API_BASE}/media/upload-from-url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, type }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to upload media from URL')
  }

  return response.json()
}

/**
 * Get media details
 */
export async function getMediaDetails(mediaId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/media/${mediaId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to get media details')
  }

  return response.json()
}

/**
 * Delete media
 */
export async function deleteMedia(mediaId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/media/${mediaId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete media')
  }

  return response.json()
}
