import { Router } from 'express'
import analyticsController from '../controllers/analyticsController'
import { asyncHandler } from '../middleware/asyncHandler'

const router = Router()

// GET messages count
router.get('/messages-count', asyncHandler(analyticsController.getMessagesCount))

// GET response times
router.get('/response-times', asyncHandler(analyticsController.getResponseTimes))

// GET agent stats
router.get('/agent-stats', asyncHandler(analyticsController.getAgentStats))

// GET export messages
router.get('/export', asyncHandler(analyticsController.exportMessages))

export default router
