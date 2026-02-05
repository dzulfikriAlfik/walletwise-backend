/**
 * Wallet Controller
 * Handles HTTP requests for wallet endpoints
 */

import type { Request, Response, NextFunction } from 'express'
import { walletService } from '@/services/wallet.service'
import { createWalletSchema, updateWalletSchema } from '@/schemas/wallet.schemas'
import { ValidationError } from '@/utils/errors'
import { formatZodErrors } from '@/utils/validation'

export class WalletController {
  /**
   * Get all wallets for current user
   * GET /api/wallets
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      const wallets = await walletService.getAll(userId)

      res.status(200).json({
        success: true,
        data: wallets,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get a single wallet by ID
   * GET /api/wallets/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId
      const walletId = req.params.id as string

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      const wallet = await walletService.getById(userId, walletId)

      res.status(200).json({
        success: true,
        data: wallet,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Create a new wallet
   * POST /api/wallets
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      // Validate request body
      const validationResult = createWalletSchema.safeParse(req.body)

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error)
        throw new ValidationError('Validation failed', errors)
      }

      const wallet = await walletService.create(userId, validationResult.data)

      res.status(201).json({
        success: true,
        data: wallet,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update a wallet
   * PATCH /api/wallets/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId
      const walletId = req.params.id as string

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      // Validate request body
      const validationResult = updateWalletSchema.safeParse(req.body)

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error)
        throw new ValidationError('Validation failed', errors)
      }

      const wallet = await walletService.update(userId, walletId, validationResult.data)

      res.status(200).json({
        success: true,
        data: wallet,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Delete a wallet
   * DELETE /api/wallets/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId
      const walletId = req.params.id as string

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      const result = await walletService.delete(userId, walletId)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get wallet summary
   * GET /api/wallets/summary
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      const summary = await walletService.getSummary(userId)

      res.status(200).json({
        success: true,
        data: summary,
      })
    } catch (error) {
      next(error)
    }
  }
}

export const walletController = new WalletController()
