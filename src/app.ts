/**
 * Express application setup
 * Middleware and route configuration
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import path from 'path'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error.middleware.js'
import { requestLogger } from './middleware/logger.middleware.js'
import { authRoutes, walletRoutes, transactionRoutes, billingRoutes } from './routes/index.js'

const app = express()

// Middleware
app.use(helmet())
app.use(cors({
  origin: env.CORS_ORIGIN.split(','),
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(requestLogger)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API v1 (versioned)
const v1Router = express.Router()
v1Router.use('/auth', authRoutes)
v1Router.use('/wallets', walletRoutes)
v1Router.use('/transactions', transactionRoutes)
v1Router.use('/billing', billingRoutes)

// Serve OpenAPI 3.1 specification
v1Router.get('/openapi.yaml', (_req, res) => {
  const specPath = path.join(process.cwd(), 'docs', 'openapi', 'openapi.yaml')
  res.type('application/openapi+yaml').sendFile(specPath)
})

app.use('/api/v1', v1Router)

// Legacy: redirect /api/* to /api/v1/* for backward compatibility
app.use('/api/auth', authRoutes)
app.use('/api/wallets', walletRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/billing', billingRoutes)

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
