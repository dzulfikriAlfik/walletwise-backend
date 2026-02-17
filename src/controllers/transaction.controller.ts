/**
 * Transaction Controller
 * Handles HTTP requests for transaction endpoints
 */

import type { Request, Response, NextFunction } from 'express'
import { transactionService } from '../services/transaction.service.js'
import { createTransactionSchema, updateTransactionSchema } from '../schemas/transaction.schemas.js'
import { ValidationError } from '../utils/errors.js'
import { formatZodErrors } from '../utils/validation.js'

export class TransactionController {
  /**
   * Get all transactions for current user
   * GET /api/transactions
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      // Parse query filters
      const filters = {
        walletId: req.query.walletId as string | undefined,
        type: req.query.type as 'income' | 'expense' | undefined,
        category: req.query.category as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      }

      const transactions = await transactionService.getAll(userId, filters)

      res.status(200).json({
        success: true,
        data: transactions,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get a single transaction by ID
   * GET /api/transactions/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId
      const transactionId = req.params.id as string

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      const transaction = await transactionService.getById(userId, transactionId)

      res.status(200).json({
        success: true,
        data: transaction,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create a new transaction
   * POST /api/transactions
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      // Validate request body
      const validationResult = createTransactionSchema.safeParse(req.body)

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error)
        throw new ValidationError('Validation failed', errors)
      }

      const transaction = await transactionService.create(userId, validationResult.data)

      res.status(201).json({
        success: true,
        data: transaction,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update a transaction
   * PATCH /api/transactions/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId
      const transactionId = req.params.id as string

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      // Validate request body
      const validationResult = updateTransactionSchema.safeParse(req.body)

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error)
        throw new ValidationError('Validation failed', errors)
      }

      const transaction = await transactionService.update(
        userId,
        transactionId,
        validationResult.data
      )

      res.status(200).json({
        success: true,
        data: transaction,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete a transaction
   * DELETE /api/transactions/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId
      const transactionId = req.params.id as string

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      const result = await transactionService.delete(userId, transactionId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get transaction summary
   * GET /api/transactions/summary
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      // Parse query filters
      const filters = {
        walletId: req.query.walletId as string | undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      }

      const summary = await transactionService.getSummary(userId, filters)

      res.status(200).json({
        success: true,
        data: summary,
      })
    } catch (error) {
      next(error)
    }
  }
}

export const transactionController = new TransactionController()
