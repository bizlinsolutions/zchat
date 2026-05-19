import { Router } from 'express'
import assignmentController from '../controllers/assignmentController'
import { asyncHandler } from '../middleware/asyncHandler'
import { validateAssignmentForm } from '../middleware/validation'

const router = Router()

// POST assign agent to message
router.post('/', validateAssignmentForm, asyncHandler(assignmentController.assignAgent))

// GET assignments by agent
router.get('/agent/:agent_id', asyncHandler(assignmentController.getAssignmentsByAgent))

// GET assignments by message
router.get('/message/:message_id', asyncHandler(assignmentController.getAssignmentsByMessage))

export default router
