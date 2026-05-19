import { Request, Response } from 'express'
import { contactService } from '../services/contactService'
import { logger } from '../utils/logger'
import { ValidationError } from '../utils/errors'

async function getAllContacts(req: Request, res: Response): Promise<void> {
  try {
    const contacts = await contactService.getAllContacts()
    res.json(contacts)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to fetch contacts', { error: error.message })
    res.status(500).json({ error: 'Failed to get contacts' })
  }
}

async function getContact(req: Request, res: Response): Promise<void> {
  try {
    const { wa_id } = req.params
    const contact = await contactService.getContactByWaId(wa_id)
    res.json(contact)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to fetch contact', { error: error.message })
    res.status(404).json({ error: 'Contact not found' })
  }
}

async function createContact(req: Request, res: Response): Promise<void> {
  try {
    const { wa_id, name, phone, email } = req.body
    if (!wa_id) {
      throw new ValidationError('WhatsApp ID (wa_id) is required')
    }

    const contact = await contactService.createContact({
      wa_id,
      name,
      phone,
      email,
    })

    res.status(201).json(contact)
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message })
      return
    }
    const error = err as Error
    logger.error('Failed to create contact', { error: error.message })
    res.status(500).json({ error: 'Failed to add contact' })
  }
}

export default {
  getAllContacts,
  getContact,
  createContact,
}
