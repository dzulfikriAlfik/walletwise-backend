/**
 * Transaction Routes (API v1)
 * Defines all transaction-related endpoints
 */

import { Router } from 'express'
import { transactionController } from '../../controllers/transaction.controller.js'
import { verifyToken } from '../../middleware/auth.middleware.js'
import { requireProPlus } from '../../middleware/subscription.middleware.js'

const router = Router()

// All transaction routes require authentication
router.use(verifyToken)

// Get transaction summary (must be before /:id to avoid conflict)
// GET /api/v1/transactions/summary
router.get('/summary', (req, res, next) => transactionController.getSummary(req, res, next))

// Pro+ endpoints
router.get('/analytics', requireProPlus, (req, res, next) => transactionController.getAnalytics(req, res, next))
router.get('/export', requireProPlus, (req, res, next) => transactionController.exportTransactions(req, res, next))

// Get all transactions
// GET /api/v1/transactions
router.get('/', (req, res, next) => transactionController.getAll(req, res, next))

// Get a single transaction
// GET /api/v1/transactions/:id
router.get('/:id', (req, res, next) => transactionController.getById(req, res, next))

// Create a new transaction
// POST /api/v1/transactions
router.post('/', (req, res, next) => transactionController.create(req, res, next))

// Update a transaction
// PATCH /api/v1/transactions/:id
router.patch('/:id', (req, res, next) => transactionController.update(req, res, next))

// Delete a transaction
// DELETE /api/v1/transactions/:id
router.delete('/:id', (req, res, next) => transactionController.delete(req, res, next))

export default router
