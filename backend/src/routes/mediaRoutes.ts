import { Router } from 'express'
import * as mediaController from '../controllers/mediaUploadController'

const router = Router()

/**
 * Media Upload Routes
 * For uploading media files that will be used in WhatsApp messages
 */

// Upload media file
router.post('/upload', mediaController.upload.single('file'), mediaController.uploadMediaToWhatsApp)

// Upload media from URL
router.post('/upload-from-url', mediaController.uploadMediaFromUrl)

// Get media details
router.get('/:mediaId', mediaController.getMediaDetails)

// Delete media
router.delete('/:mediaId', mediaController.deleteMedia)

export default router
