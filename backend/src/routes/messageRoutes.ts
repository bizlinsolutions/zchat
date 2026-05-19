import { Router } from 'express'
import messageController from '../controllers/messageController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

// GET all messages
router.get('/', asyncHandler(messageController.getAllMessages))

// POST create message
router.post('/', asyncHandler(messageController.createMessage))

// POST send text message
router.post('/send', asyncHandler(messageController.sendTextMessage))

// POST send media message
router.post('/sendMedia', asyncHandler(messageController.sendMediaMessage))

// POST send template message
router.post('/sendTemplate', asyncHandler(messageController.sendTemplateMessage))

export default router
