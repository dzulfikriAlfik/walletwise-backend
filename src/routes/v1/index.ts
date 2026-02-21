/**
 * API v1 Routes
 * Mounts all v1 route modules under /api/v1
 */

import express from 'express'
import path from 'path'
import authRoutes from './auth.routes.js'
import walletRoutes from './wallet.routes.js'
import transactionRoutes from './transaction.routes.js'
import billingRoutes from './billing.routes.js'

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

export default v1Router
