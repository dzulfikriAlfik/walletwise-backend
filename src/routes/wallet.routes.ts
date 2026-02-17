/**
 * Wallet Routes
 * Defines all wallet-related endpoints
 */

import { Router } from 'express'
import { walletController } from '../controllers/wallet.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const router = Router()

// All wallet routes require authentication
router.use(verifyToken)

// Get wallet summary (must be before /:id to avoid conflict)
// GET /api/wallets/summary
router.get('/summary', (req, res, next) => walletController.getSummary(req, res, next))

// Get all wallets
// GET /api/wallets
router.get('/', (req, res, next) => walletController.getAll(req, res, next))

// Get a single wallet
// GET /api/wallets/:id
router.get('/:id', (req, res, next) => walletController.getById(req, res, next))

// Create a new wallet
// POST /api/wallets
router.post('/', (req, res, next) => walletController.create(req, res, next))

// Update a wallet
// PATCH /api/wallets/:id
router.patch('/:id', (req, res, next) => walletController.update(req, res, next))

// Delete a wallet
// DELETE /api/wallets/:id
router.delete('/:id', (req, res, next) => walletController.delete(req, res, next))

export default router
