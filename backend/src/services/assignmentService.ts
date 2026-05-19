import { logger } from '../utils/logger'
import db from './databaseService'
import { ValidationError } from '../utils/errors'

async function assignAgentToMessage(messageId: string, agentId: number | string): Promise<any> {
  try {
    if (!messageId || !agentId) {
      throw new ValidationError('message_id and agent_id are required')
    }
    const assignment = await db.assignAgent({
      message_id: messageId,
      agent_id: parseInt(String(agentId), 10),
    })
    logger.info('Agent assigned to message', { messageId, agentId })
    return assignment
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error assigning agent', { messageId, agentId, error: msg })
    throw err
  }
}

async function getAssignmentsByAgent(agentId: number): Promise<any[]> {
  try {
    return await db.getAssignmentsByAgent(agentId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error fetching assignments by agent', { agentId, error: msg })
    throw err
  }
}

async function getAssignmentsByMessage(messageId: string): Promise<any[]> {
  try {
    return await db.getAssignmentsByMessage(messageId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error fetching assignments by message', { messageId, error: msg })
    throw err
  }
}

export const assignmentService = {
  assignAgentToMessage,
  getAssignmentsByAgent,
  getAssignmentsByMessage,
}
