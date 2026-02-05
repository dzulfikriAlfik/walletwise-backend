/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import type { Request, Response, NextFunction } from 'express'
import { authService } from '@/services/auth.service'
import { registerSchema, loginSchema, refreshTokenSchema } from '@/schemas/auth.schemas'
import { ValidationError } from '@/utils/errors'
import { formatZodErrors } from '@/utils/validation'

export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validationResult = registerSchema.safeParse(req.body)

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error)
        throw new ValidationError('Validation failed', errors)
      }

      // Register user
      const result = await authService.register(validationResult.data)

      res.status(201).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validationResult = loginSchema.safeParse(req.body)

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error)
        throw new ValidationError('Validation failed', errors)
      }

      // Login user
      const result = await authService.login(validationResult.data)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validationResult = refreshTokenSchema.safeParse(req.body)

      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error)
        throw new ValidationError('Validation failed', errors)
      }

      // Refresh token
      const result = await authService.refreshToken(validationResult.data.refreshToken)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get user profile
   * GET /api/auth/profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User ID is attached by auth middleware
      const userId = (req as any).user?.userId

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      const profile = await authService.getProfile(userId)

      res.status(200).json({
        success: true,
        data: profile,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update user profile
   * PATCH /api/auth/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User ID is attached by auth middleware
      const userId = (req as any).user?.userId

      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      const { name, avatarUrl } = req.body

      const profile = await authService.updateProfile(userId, { name, avatarUrl })

      res.status(200).json({
        success: true,
        data: profile,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Just return success - token is cleared on frontend
      // In production, you might want to blacklist the token
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      })
    } catch (error) {
      next(error)
    }
  }
}

export const authController = new AuthController()
