import { Request, Response } from 'express'
import { mediaUploadService } from '../services/mediaUploadService'
import { logger } from '../utils/logger'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'data', 'uploads')

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  },
})

export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max (WhatsApp document limit)
  },
  fileFilter: (req, file, cb) => {
    // Validate file types based on media type
    const mediaType = req.body.type
    const validMimeTypes: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png'],
      video: ['video/mp4', 'video/3gpp'],
      audio: ['audio/aac', 'audio/mp4', 'audio/mpeg', 'audio/ogg'],
      document: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
      ],
      sticker: ['image/webp'],
    }

    const allowed = validMimeTypes[mediaType] || []
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Invalid file type for ${mediaType}: ${file.mimetype}`))
    }
  },
})

/**
 * Upload media file to WhatsApp
 * POST /api/media/upload
 * Expects multipart/form-data with file and type fields
 */
export async function uploadMediaToWhatsApp(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    const mediaType = req.body.type as 'image' | 'video' | 'audio' | 'document' | 'sticker'

    if (!mediaType) {
      res.status(400).json({ error: 'Missing required field: type (image, video, audio, document, sticker)' })
      return
    }

    const validTypes = ['image', 'video', 'audio', 'document', 'sticker']
    if (!validTypes.includes(mediaType)) {
      res.status(400).json({ error: `Invalid media type. Must be one of: ${validTypes.join(', ')}` })
      return
    }

    // Upload to WhatsApp
    const uploadResponse = await mediaUploadService.uploadMedia(req.file.path, mediaType)

    // Clean up local file after upload
    fs.unlink(req.file.path, (err) => {
      if (err) logger.warn('Failed to delete temporary file', { path: req.file?.path })
    })

    res.json({
      success: true,
      mediaId: uploadResponse.id,
      mimeType: uploadResponse.mime_type,
      filename: req.file.originalname,
      size: req.file.size,
    })
  } catch (err) {
    const error = err as Error
    logger.error('Failed to upload media', { error: error.message })

    // Clean up file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) logger.warn('Failed to delete temporary file', { path: req.file?.path })
      })
    }

    res.status(500).json({ error: error.message })
  }
}

/**
 * Upload media from URL to WhatsApp
 * POST /api/media/upload-from-url
 */
export async function uploadMediaFromUrl(req: Request, res: Response): Promise<void> {
  try {
    const { url, type } = req.body

    if (!url || !type) {
      res.status(400).json({ error: 'Missing required fields: url, type' })
      return
    }

    const validTypes = ['image', 'video', 'audio', 'document', 'sticker']
    if (!validTypes.includes(type)) {
      res.status(400).json({ error: `Invalid media type. Must be one of: ${validTypes.join(', ')}` })
      return
    }

    // Upload from URL to WhatsApp
    const uploadResponse = await mediaUploadService.uploadMedia(url, type)

    res.json({
      success: true,
      mediaId: uploadResponse.id,
      mimeType: uploadResponse.mime_type,
      sourceUrl: url,
    })
  } catch (err) {
    const error = err as Error
    logger.error('Failed to upload media from URL', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get media details
 * GET /api/media/:mediaId
 */
export async function getMediaDetails(req: Request, res: Response): Promise<void> {
  try {
    const { mediaId } = req.params

    if (!mediaId) {
      res.status(400).json({ error: 'Missing required parameter: mediaId' })
      return
    }

    const mediaDetails = await mediaUploadService.getMedia(mediaId)
    res.json(mediaDetails)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to get media details', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}

/**
 * Delete media
 * DELETE /api/media/:mediaId
 */
export async function deleteMedia(req: Request, res: Response): Promise<void> {
  try {
    const { mediaId } = req.params

    if (!mediaId) {
      res.status(400).json({ error: 'Missing required parameter: mediaId' })
      return
    }

    await mediaUploadService.deleteMedia(mediaId)
    res.json({ success: true, message: 'Media deleted successfully' })
  } catch (err) {
    const error = err as Error
    logger.error('Failed to delete media', { error: error.message })
    res.status(500).json({ error: error.message })
  }
}
