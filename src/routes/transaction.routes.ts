/**
 * Transaction Routes
 * Defines all transaction-related endpoints
 */

import { Router } from 'express'
import { transactionController } from '@/controllers/transaction.controller'
import { verifyToken } from '@/middleware/auth.middleware'

const router = Router()

// All transaction routes require authentication
router.use(verifyToken)

// Get transaction summary (must be before /:id to avoid conflict)
// GET /api/transactions/summary
router.get('/summary', (req, res, next) => transactionController.getSummary(req, res, next))

// Get all transactions
// GET /api/transactions
router.get('/', (req, res, next) => transactionController.getAll(req, res, next))

// Get a single transaction
// GET /api/transactions/:id
router.get('/:id', (req, res, next) => transactionController.getById(req, res, next))

// Create a new transaction
// POST /api/transactions
router.post('/', (req, res, next) => transactionController.create(req, res, next))

// Update a transaction
// PATCH /api/transactions/:id
router.patch('/:id', (req, res, next) => transactionController.update(req, res, next))

// Delete a transaction
// DELETE /api/transactions/:id
router.delete('/:id', (req, res, next) => transactionController.delete(req, res, next))

export default router
