import axios, { AxiosError } from 'axios'
import FormData from 'form-data'
import fs from 'fs'
import { config } from '../config/environment'
import { logger } from '../utils/logger'

interface UploadResponse {
  h: string
  mime_type: string
  id: string
}

/**
 * WhatsApp Media Upload Service
 * Handles uploading media files to WhatsApp Cloud API
 * Supported types: images, videos, audio, documents, stickers
 */
export const mediaUploadService = {
  /**
   * Upload media file to WhatsApp
   * @param filePath Local file path or URL to upload
   * @param mediaType Type of media: image, video, audio, document, sticker
   * @returns Media ID for use in sending messages
   */
  async uploadMedia(filePath: string, mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker'): Promise<UploadResponse> {
    try {
      const phoneNumberId = config.whatsapp.phoneNumberId
      const accessToken = config.whatsapp.accessToken
      const apiVersion = config.whatsapp.apiVersion || 'v25.0'

      const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`

      // Determine if input is file path or URL
      let fileBuffer: Buffer
      let filename: string

      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        // Download from URL
        const response = await axios.get(filePath, { responseType: 'arraybuffer' })
        fileBuffer = Buffer.from(response.data)
        filename = filePath.split('/').pop() || 'media'
      } else {
        // Read local file
        fileBuffer = fs.readFileSync(filePath)
        filename = filePath.split(/[\\/]/).pop() || 'media'
      }

      // Create FormData
      const form = new FormData()
      form.append('messaging_product', 'whatsapp')
      form.append('type', mediaType)
      form.append('file', fileBuffer, filename)

      const response = await axios.post(url, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      })

      logger.info('Media uploaded successfully to WhatsApp', {
        mediaType,
        mediaId: response.data.id,
        mimeType: response.data.mime_type,
      })

      return response.data as UploadResponse
    } catch (err) {
      const error = err as AxiosError<any>
      const errorData = error.response?.data

      logger.error('Failed to upload media to WhatsApp', {
        filePath,
        mediaType,
        status: error.response?.status,
        errorCode: errorData?.error?.code,
        errorMessage: errorData?.error?.message,
      })

      throw new Error(`WhatsApp upload error: ${errorData?.error?.message || error.message}`)
    }
  },

  /**
   * Get media from WhatsApp (retrieve media by ID)
   * @param mediaId WhatsApp media ID
   * @returns Media details including download URL
   */
  async getMedia(mediaId: string): Promise<any> {
    try {
      const accessToken = config.whatsapp.accessToken
      const apiVersion = config.whatsapp.apiVersion || 'v25.0'

      const url = `https://graph.facebook.com/${apiVersion}/${mediaId}`

      const response = await axios.get(url, {
        params: {
          phone_number_id: config.whatsapp.phoneNumberId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      logger.info('Media retrieved successfully', { mediaId })
      return response.data
    } catch (err) {
      const error = err as AxiosError<any>
      const errorData = error.response?.data

      logger.error('Failed to retrieve media', {
        mediaId,
        status: error.response?.status,
        errorMessage: errorData?.error?.message,
      })

      throw new Error(`WhatsApp media retrieval error: ${errorData?.error?.message || error.message}`)
    }
  },

  /**
   * Delete media from WhatsApp
   * @param mediaId WhatsApp media ID
   */
  async deleteMedia(mediaId: string): Promise<void> {
    try {
      const accessToken = config.whatsapp.accessToken
      const apiVersion = config.whatsapp.apiVersion || 'v25.0'

      const url = `https://graph.facebook.com/${apiVersion}/${mediaId}`

      await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      logger.info('Media deleted successfully', { mediaId })
    } catch (err) {
      const error = err as AxiosError<any>
      const errorData = error.response?.data

      logger.error('Failed to delete media', {
        mediaId,
        status: error.response?.status,
        errorMessage: errorData?.error?.message,
      })

      throw new Error(`WhatsApp media deletion error: ${errorData?.error?.message || error.message}`)
    }
  },
}
