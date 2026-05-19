import { Router } from 'express'
import contactController from '../controllers/contactController'
import { asyncHandler } from '../middleware/asyncHandler'
import { validateContactForm } from '../middleware/validation'

const router = Router()

// GET all contacts
router.get('/', asyncHandler(contactController.getAllContacts))

// GET specific contact
router.get('/:wa_id', asyncHandler(contactController.getContact))

// POST create contact
router.post('/', validateContactForm, asyncHandler(contactController.createContact))

export default router
