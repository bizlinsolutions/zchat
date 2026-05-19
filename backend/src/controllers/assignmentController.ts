import { Request, Response } from 'express'
import { assignmentService } from '../services/assignmentService'
import { logger } from '../utils/logger'
import { ValidationError } from '../utils/errors'

async function assignAgent(req: Request, res: Response): Promise<void> {
  try {
    const { message_id, agent_id } = req.body
    if (!message_id || !agent_id) {
      throw new ValidationError('message_id and agent_id are required')
    }

    const assignment = await assignmentService.assignAgentToMessage(message_id, agent_id)
    res.status(201).json(assignment)
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message })
      return
    }
    const error = err as Error
    logger.error('Failed to assign agent', { error: error.message })
    res.status(500).json({ error: 'Failed to assign agent' })
  }
}

async function getAssignmentsByAgent(req: Request, res: Response): Promise<void> {
  try {
    const { agent_id } = req.params
    const assignments = await assignmentService.getAssignmentsByAgent(agent_id)
    res.json(assignments)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to fetch assignments by agent', { error: error.message })
    res.status(500).json({ error: 'Failed to get assignments' })
  }
}

async function getAssignmentsByMessage(req: Request, res: Response): Promise<void> {
  try {
    const { message_id } = req.params
    const assignments = await assignmentService.getAssignmentsByMessage(message_id)
    res.json(assignments)
  } catch (err) {
    const error = err as Error
    logger.error('Failed to fetch assignments by message', { error: error.message })
    res.status(500).json({ error: 'Failed to get assignments' })
  }
}

export default {
  assignAgent,
  getAssignmentsByAgent,
  getAssignmentsByMessage,
}
