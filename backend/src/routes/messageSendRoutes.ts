import { Router } from 'express'
import * as sendController from '../controllers/messageSendController'

const router = Router()

/**
 * Outbound Message Routes
 * All routes for sending different message types to WhatsApp users
 */

// Text message
router.post('/send-text', sendController.sendTextMessage)

// Media messages
router.post('/send-image', sendController.sendImageMessage)
router.post('/send-video', sendController.sendVideoMessage)
router.post('/send-audio', sendController.sendAudioMessage)
router.post('/send-document', sendController.sendDocumentMessage)
router.post('/send-sticker', sendController.sendStickerMessage)

// Location and contact messages
router.post('/send-location', sendController.sendLocationMessage)
router.post('/send-contacts', sendController.sendContactsMessage)

// Interactive messages
router.post('/send-location-request', sendController.sendLocationRequest)
router.post('/send-address', sendController.sendAddressMessage)
router.post('/send-buttons', sendController.sendButtonMessage)
router.post('/send-list', sendController.sendListMessage)

// Special messages
router.post('/send-reaction', sendController.sendReactionMessage)

// Template messages
router.post('/send-template', sendController.sendTemplateMessage)

export default router
