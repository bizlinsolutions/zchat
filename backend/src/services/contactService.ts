import { logger } from '../utils/logger'
import db from './databaseService'
import { ValidationError, NotFoundError } from '../utils/errors'

interface ContactData {
  wa_id: string
  name?: string | null
  phone?: string | null
  email?: string | null
}

async function getAllContacts(): Promise<ContactData[]> {
  try {
    return await db.getContacts()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error fetching contacts', { error: msg })
    throw err
  }
}

async function getContactByWaId(waId: string): Promise<ContactData> {
  try {
    const contact = await db.getContactByWaId(waId)
    if (!contact) {
      throw new NotFoundError('Contact not found')
    }
    return contact
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error fetching contact', { waId, error: msg })
    throw err
  }
}

async function createContact(contactData: Partial<ContactData>): Promise<ContactData> {
  try {
    if (!contactData.wa_id) {
      throw new ValidationError('WhatsApp ID (wa_id) is required')
    }
    const contact = await db.addContact({
      wa_id: contactData.wa_id,
      name: contactData.name || null,
      phone: contactData.phone || null,
      email: contactData.email || null,
    })
    logger.info('Contact created', { waId: contactData.wa_id })
    return contact
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error creating contact', { error: msg })
    throw err
  }
}

export const contactService = {
  getAllContacts,
  getContactByWaId,
  createContact,
}
