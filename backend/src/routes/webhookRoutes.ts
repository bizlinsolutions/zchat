import { Router, raw } from 'express'
import webhookController from '../controllers/webhookController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

// Support optional phoneId param so each WABA can register a webhook like /webhook/:phoneId
// GET webhook verification
router.get('/:phoneId?', webhookController.verifyWebhook)

// POST webhook handler - use raw body parser to verify signatures correctly
router.post('/:phoneId?', raw({ type: 'application/json' }), asyncHandler(webhookController.handleWebhook))

export default router
