/**
 * Express application setup
 * Middleware and route configuration
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error.middleware.js'
import { requestLogger } from './middleware/logger.middleware.js'
import v1Router from './routes/v1/index.js'
import { stripeWebhookRouter, xenditWebhookRouter } from './routes/webhook.routes.js'

const app = express()

// Middleware
app.use(helmet())
app.use(cors({
  origin: env.CORS_ORIGIN.split(','),
  credentials: true,
}))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(requestLogger)

// Stripe webhook MUST use raw body for signature verification - mount BEFORE express.json()
app.use('/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhookRouter)

app.use(express.json())

// Xendit webhook uses JSON body - mount after express.json()
app.use('/webhook/xendit', xenditWebhookRouter)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API v1
app.use('/api/v1', v1Router)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.path} not found`,
    },
  })
})

// Error handler (must be last)
app.use(errorHandler)

export default app
