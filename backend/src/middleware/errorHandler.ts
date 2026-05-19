import type { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'
import { AppError } from '../utils/errors'

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    logger.warn('Application error', {
      name: err.name,
      message: err.message,
      statusCode: err.statusCode,
    })
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.name,
    })
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY' || err.code === 'UNIQUE constraint failed') {
    logger.warn('Duplicate entry error', { message: err.message })
    return res.status(409).json({ error: 'Resource already exists' })
  }

  // Unexpected errors
  logger.error('Unexpected error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  return res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { message: err.message }),
  })
}
