import { Request, Response } from 'express'
import { analyticsService } from '../services/analyticsService'
import { logger } from '../utils/logger'

async function getMessagesCount(req: Request, res: Response): Promise<void> {
  try {
    const from = req.query.from ? parseInt(req.query.from as string, 10) : null
    const to = req.query.to ? parseInt(req.query.to as string, 10) : null
    const result = await analyticsService.getMessagesCount(from, to)
    res.json(result)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to get messages count', { error: error.message })
    res.status(500).json({ error: 'Failed to compute messages count' })
  }
}

async function getResponseTimes(req: Request, res: Response): Promise<void> {
  try {
    const from = req.query.from ? parseInt(req.query.from as string, 10) : null
    const to = req.query.to ? parseInt(req.query.to as string, 10) : null
    const result = await analyticsService.getResponseTimes(from, to)
    res.json(result)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to get response times', { error: error.message })
    res.status(500).json({ error: 'Failed to compute response times' })
  }
}

async function getAgentStats(req: Request, res: Response): Promise<void> {
  try {
    const from = req.query.from ? parseInt(req.query.from as string, 10) : null
    const to = req.query.to ? parseInt(req.query.to as string, 10) : null
    const result = await analyticsService.getAgentStats(from, to)
    res.json(result)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to get agent stats', { error: error.message })
    res.status(500).json({ error: 'Failed to compute agent stats' })
  }
}

async function exportMessages(req: Request, res: Response): Promise<void> {
  try {
    const from = req.query.from ? parseInt(req.query.from as string, 10) : null
    const to = req.query.to ? parseInt(req.query.to as string, 10) : null
    const format = (req.query.format as string || 'json').toLowerCase()

    const result = await analyticsService.exportMessages(from, to, format)

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename="messages.csv"')
      res.send(result.data)
      return
    }

    res.json(result.data)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to export messages', { error: error.message })
    res.status(500).json({ error: 'Failed to export messages' })
  }
}

export default {
  getMessagesCount,
  getResponseTimes,
  getAgentStats,
  exportMessages,
}
