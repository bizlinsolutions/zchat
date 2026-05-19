import { logger } from '../utils/logger'
import db from './databaseService'
import { ValidationError } from '../utils/errors'

interface AdminData {
  username: string
  password_hash: string
  name?: string | null
  email?: string | null
}

interface WhatsAppAccountData {
  phone_id: string
  token: string
  api_version?: string
}

async function getAdminCount(): Promise<number> {
  try {
    return await db.getAdminCount()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error getting admin count', { error: msg })
    throw err
  }
}

async function createAdmin(adminData: AdminData): Promise<void> {
  try {
    if (!adminData.username || !adminData.password_hash) {
      throw new ValidationError('Username and password_hash are required')
    }
    await db.createAdmin({
      username: adminData.username,
      password_hash: adminData.password_hash,
      name: adminData.name || null,
      email: adminData.email || null,
    })
    logger.info('Admin account created', { username: adminData.username })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error creating admin', { error: msg })
    throw err
  }
}

async function getWhatsAppAccount(): Promise<any> {
  try {
    return await db.getWhatsAppAccount()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error fetching WhatsApp account', { error: msg })
    throw err
  }
}

async function getWhatsAppAccountByPhoneId(phone_id: string): Promise<any> {
  try {
    return await db.getWhatsAppAccountByPhoneId(phone_id)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error fetching WhatsApp account by phone_id', { phone_id, error: msg })
    throw err
  }
}

async function saveWhatsAppAccount(accountData: WhatsAppAccountData): Promise<void> {
  try {
    if (!accountData.phone_id || !accountData.token) {
      throw new ValidationError('phone_id and token are required')
    }
    await db.saveWhatsAppAccount({
      phone_id: accountData.phone_id,
      token: accountData.token,
      api_version: accountData.api_version || 'v15.0',
    })
    logger.info('WhatsApp account saved', { phoneId: accountData.phone_id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error saving WhatsApp account', { error: msg })
    throw err
  }
}

async function getAllWhatsAppAccounts(): Promise<any[]> {
  try {
    return await db.getAllWhatsAppAccounts()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error fetching all WhatsApp accounts', { error: msg })
    throw err
  }
}

export const setupService = {
  getAdminCount,
  createAdmin,
  getWhatsAppAccount,
  getWhatsAppAccountByPhoneId,
  getAllWhatsAppAccounts,
  saveWhatsAppAccount,
}
