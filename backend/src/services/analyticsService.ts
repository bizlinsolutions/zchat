import { logger } from '../utils/logger'
import db from './databaseService'
import { messageService } from './messageService'

interface Message {
  id: string
  text?: string
  sender?: string
  ts: number
  wa_id?: string
  direction?: string
  type?: string
  media_url?: string
  status?: string
}

async function getMessagesCount(tsFrom?: number, tsTo?: number): Promise<{ count: number }> {
  try {
    const count = await messageService.getMessagesCount(tsFrom, tsTo)
    return { count }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error getting messages count', { error: msg })
    throw err
  }
}

async function getResponseTimes(tsFrom?: number, tsTo?: number): Promise<{ avg_response_ms: number | null; samples: number }> {
  try {
    const messages = await messageService.getMessagesBetween(tsFrom, tsTo)
    const inboundMsgs = messages.filter((m) => m.direction === 'inbound')
    const outboundMsgs = messages.filter((m) => m.direction === 'outbound').sort((a, b) => a.ts - b.ts)

    const responseTimes: number[] = []
    for (const inMsg of inboundMsgs) {
      const candidate = outboundMsgs.find((o) => o.wa_id === inMsg.wa_id && o.ts > inMsg.ts)
      if (candidate) {
        responseTimes.push(candidate.ts - inMsg.ts)
      }
    }

    const avg = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : null

    logger.info('Response times calculated', { samples: responseTimes.length })
    return { avg_response_ms: avg, samples: responseTimes.length }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error calculating response times', { error: msg })
    throw err
  }
}

async function getAgentStats(
  tsFrom?: number,
  tsTo?: number
): Promise<Array<{ agent_id: number; inbound: number; outbound: number; avg_response_ms: number | null }>> {
  try {
    const messages = await messageService.getMessagesBetween(tsFrom, tsTo)
    const assignments: Record<number, any> = {}

    for (const m of messages) {
      const assigns = await db.getAssignmentsByMessage(m.id)
      for (const a of assigns) {
        const agentId = a.agent_id
        if (!assignments[agentId]) {
          assignments[agentId] = {
            agent_id: agentId,
            inbound: 0,
            outbound: 0,
            responseTimes: [],
          }
        }
        if (m.direction === 'inbound') assignments[agentId].inbound++
        if (m.direction === 'outbound') assignments[agentId].outbound++
      }
    }

    const inboundMsgs = messages.filter((m) => m.direction === 'inbound')
    const outboundMsgs = messages.filter((m) => m.direction === 'outbound').sort((a, b) => a.ts - b.ts)

    for (const inMsg of inboundMsgs) {
      const assigns = await db.getAssignmentsByMessage(inMsg.id)
      const candidate = outboundMsgs.find((o) => o.wa_id === inMsg.wa_id && o.ts > inMsg.ts)
      if (!candidate) continue
      for (const a of assigns) {
        const ag = assignments[a.agent_id]
        if (ag) ag.responseTimes.push(candidate.ts - inMsg.ts)
      }
    }

    const result = Object.values(assignments).map((s: any) => ({
      agent_id: s.agent_id,
      inbound: s.inbound,
      outbound: s.outbound,
      avg_response_ms: s.responseTimes.length ? Math.round(s.responseTimes.reduce((a: number, b: number) => a + b, 0) / s.responseTimes.length) : null,
    }))

    logger.info('Agent stats calculated', { agents: result.length })
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error calculating agent stats', { error: msg })
    throw err
  }
}

async function exportMessages(
  tsFrom?: number,
  tsTo?: number,
  format: string = 'json'
): Promise<{ format: string; data: any }> {
  try {
    const messages = await messageService.getMessagesBetween(tsFrom, tsTo)

    if (format === 'csv') {
      const header = 'id,text,sender,ts,wa_id,direction,type,media_url,status\n'
      const rows = messages
        .map((m) => [
          m.id,
          `"${(m.text || '').replace(/"/g, '""')}"`,
          m.sender,
          m.ts,
          m.wa_id,
          m.direction,
          m.type,
          m.media_url,
          m.status,
        ])
        .map((row) => row.join(','))
        .join('\n')
      logger.info('Messages exported to CSV', { count: messages.length })
      return { format: 'csv', data: header + rows }
    }

    logger.info('Messages exported to JSON', { count: messages.length })
    return { format: 'json', data: messages }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Error exporting messages', { error: msg })
    throw err
  }
}

export const analyticsService = {
  getMessagesCount,
  getResponseTimes,
  getAgentStats,
  exportMessages,
}
