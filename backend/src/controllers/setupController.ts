import { Request, Response } from 'express'
import { setupService } from '../services/setupService'
import { whatsappService } from '../services/whatsappService'
import bcrypt from 'bcryptjs'
import { logger } from '../utils/logger'
import { ValidationError } from '../utils/errors'

async function checkSetupStatus(req: Request, res: Response): Promise<void> {
  try {
    const count = await setupService.getAdminCount()
    res.json({ setup: !!count })
  } catch (err) {
    const error = err as Error
    logger.error('Setup status check failed', { error: error.message })
    res.status(500).json({ error: 'Failed to check setup status' })
  }
}

async function createAdmin(req: Request, res: Response): Promise<void> {
  try {
    const { username, password, name, email } = req.body
    if (!username || !password) {
      throw new ValidationError('Username and password are required')
    }

    const hash = bcrypt.hashSync(password, 10)
    await setupService.createAdmin({
      username,
      password_hash: hash,
      name,
      email,
    })

    res.status(201).json({ ok: true })
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message })
      return
    }
    const error = err as Error
    logger.error('Admin creation failed', { error: error.message })
    res.status(500).json({ error: 'Failed to create admin' })
  }
}

async function testWhatsApp(req: Request, res: Response): Promise<void> {
  try {
    const { phone_id, token, api_version } = req.body
    if (!phone_id || !token) {
      throw new ValidationError('phone_id and token are required')
    }

    const result = await whatsappService.testAccount({
      phone_id,
      token,
      api_version,
    })

    if (result.ok) {
      res.json({ ok: true, info: result.body })
      return
    }
    res.status(400).json({ ok: false, error: result.error })
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message })
      return
    }
    const error = err as Error
    logger.error('WhatsApp test failed', { error: error.message })
    res.status(500).json({ error: 'Failed to test WhatsApp account' })
  }
}

async function saveWhatsApp(req: Request, res: Response): Promise<void> {
  try {
    const { phone_id, token, api_version } = req.body
    if (!phone_id || !token) {
      throw new ValidationError('phone_id and token are required')
    }

    await setupService.saveWhatsAppAccount({
      phone_id,
      token,
      api_version,
    })

    res.status(201).json({ ok: true })
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message })
      return
    }
    const error = err as Error
    logger.error('WhatsApp save failed', { error: error.message })
    res.status(500).json({ error: 'Failed to save WhatsApp account' })
  }
}

async function getWhatsAppAccounts(req: Request, res: Response): Promise<void> {
  try {
    const accounts = await setupService.getAllWhatsAppAccounts()
    res.json(accounts || [])
  } catch (err) {
    const error = err as Error
    logger.error('Failed to fetch WhatsApp accounts', { error: error.message })
    res.status(500).json({ error: 'Failed to load WhatsApp accounts' })
  }
}

async function getWebhookConfig(req: Request, res: Response): Promise<void> {
  try {
    const protocol = req.protocol || 'https'
    const host = req.get('host') || 'localhost:3001'
    const webhookUrl = `${protocol}://${host}/webhook/whatsapp`
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token_here'

    res.json({
      webhookUrl,
      verifyToken,
      verifyTokenNote: 'Set this token in Meta/Facebook Developers webhook settings',
      webhookUrlNote: 'Set this URL in Meta/Facebook Developers webhook callback URL',
      instructions: {
        step1: 'Go to Meta Developers (developers.facebook.com)',
        step2: 'Select your app and navigate to WhatsApp > Configuration',
        step3: 'Scroll to Webhook settings',
        step4: 'Click "Edit" and paste the Webhook URL above',
        step5: 'Paste the Verify Token above',
        step6: 'Select which webhook fields to listen to (messages, message_status, message_template_status_update)',
        step7: 'Click "Verify and Save"',
      },
    })
  } catch (err) {
    const error = err as Error
    logger.error('Failed to get webhook config', { error: error.message })
    res.status(500).json({ error: 'Failed to get webhook configuration' })
  }
}

export default {
  checkSetupStatus,
  createAdmin,
  testWhatsApp,
  saveWhatsApp,
  getWhatsAppAccounts,
  getWebhookConfig,
}
