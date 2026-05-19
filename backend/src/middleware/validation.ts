import type { Request, Response, NextFunction } from 'express'
import { ValidationError } from '../utils/errors'

export const validateSetupForm = (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body
  if (!username || !password) {
    throw new ValidationError('Username and password are required')
  }
  next()
}

export const validateWhatsAppForm = (req: Request, res: Response, next: NextFunction) => {
  const { phone_id, token } = req.body
  if (!phone_id || !token) {
    throw new ValidationError('phone_id and token are required')
  }
  next()
}

export const validateContactForm = (req: Request, res: Response, next: NextFunction) => {
  const { wa_id } = req.body
  if (!wa_id) {
    throw new ValidationError('WhatsApp ID (wa_id) is required')
  }
  next()
}

export const validateAssignmentForm = (req: Request, res: Response, next: NextFunction) => {
  const { message_id, agent_id } = req.body
  if (!message_id || !agent_id) {
    throw new ValidationError('message_id and agent_id are required')
  }
  next()
}
