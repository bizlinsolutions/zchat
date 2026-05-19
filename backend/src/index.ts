import express, { type Express, type Request, type Response } from 'express'
import cors from 'cors'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'

// Configuration & utilities
import { config } from './config/environment'
import db from './config/database'
import { logger } from './utils/logger'

// Middleware
import { requestLogger } from './middleware/requestLogger'
import { errorHandler } from './middleware/errorHandler'

// Routes
import setupRoutes from './routes/setupRoutes'
import messageRoutes from './routes/messageRoutes'
import messageSendRoutes from './routes/messageSendRoutes'
import mediaRoutes from './routes/mediaRoutes'
import contactRoutes from './routes/contactRoutes'
import assignmentRoutes from './routes/assignmentRoutes'
import analyticsRoutes from './routes/analyticsRoutes'
import webhookRoutes from './routes/webhookRoutes'
import { setIO } from './utils/eventEmitter'

// Initialize Express app
const app: Express = express()

// Extend Express app with io property
declare global {
  namespace Express {
    interface Application {
      io: SocketIOServer
    }
  }
}

// CORS configuration
app.use(cors(config.cors))

// Body parsing middleware
app.use(express.json())

// Custom request logging middleware
app.use(requestLogger)

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/setup', setupRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/messages', messageSendRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api/contacts', contactRoutes)
app.use('/api/assign', assignmentRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/webhook', webhookRoutes)

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`)
  res.status(404).json({ error: 'Not found' })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Create HTTP server for Socket.io
const server = http.createServer(app)
const io = new SocketIOServer(server, { cors: { origin: '*' } })

// Set the io instance for event emitter
setIO(io)

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info('WebSocket connected', { socketId: socket.id })

  socket.on('disconnect', () => {
    logger.info('WebSocket disconnected', { socketId: socket.id })
  })
})

// Export io instance for use in other modules
app.io = io

// Database initialization and server startup
async function start(): Promise<void> {
  try {
    // Initialize database
    logger.info('Initializing database', { client: config.db.client })
    await db.init()
    logger.info('Database initialized successfully')

    // Start listening
    server.listen(config.port, () => {
      logger.info(`Backend server started`, {
        port: config.port,
        environment: config.nodeEnv,
        database: config.db.client,
      })
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    const errorStack = err instanceof Error ? err.stack : 'No stack trace'
    logger.error('Failed to start server', { error: errorMsg, stack: errorStack })
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...')
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})

// Start the server
start()

export default app
