import { Router } from 'express'
import setupController from '../controllers/setupController'
import { asyncHandler } from '../middleware/asyncHandler'
import { validateSetupForm, validateWhatsAppForm } from '../middleware/validation'

const router = Router()

// GET setup status
router.get('/status', asyncHandler(setupController.checkSetupStatus))

// POST create admin
router.post('/create-admin', validateSetupForm, asyncHandler(setupController.createAdmin))

// POST test WhatsApp credentials
router.post('/test-whatsapp', validateWhatsAppForm, asyncHandler(setupController.testWhatsApp))

// POST save WhatsApp account
router.post('/whatsapp', validateWhatsAppForm, asyncHandler(setupController.saveWhatsApp))

// GET list saved WhatsApp accounts
router.get('/whatsapp', asyncHandler(setupController.getWhatsAppAccounts))

// GET webhook configuration for Meta setup
router.get('/webhook-config', asyncHandler(setupController.getWebhookConfig))

export default router
