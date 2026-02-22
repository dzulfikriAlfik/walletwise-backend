/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */

import type { Request, Response, NextFunction } from 'express'
import { authService } from '../services/auth.service.js'
import { registerSchema, loginSchema } from '../schemas/auth.schemas.js'
import { ValidationError } from '../utils/errors.js'
import { formatZodErrors } from '../utils/validation.js'

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

      // Set httpOnly cookies
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      })

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
        },
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

      // Set httpOnly cookies
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      })

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })

      res.status(200).json({
        success: true,
        data: {
          user: result.user,
        },
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
      // Get refresh token from cookie
      const refreshToken = req.cookies.refreshToken

      if (!refreshToken) {
        throw new ValidationError('Refresh token not found')
      }

      // Refresh token
      const result = await authService.refreshToken(refreshToken)

      // Set new access token cookie
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      })

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
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

      const {
        name,
        avatarUrl,
        preferredLanguage,
        preferredCurrency,
        transactionTimeRange,
        firstDayOfWeek,
      } = req.body

      const profile = await authService.updateProfile(userId, {
        name,
        avatarUrl,
        preferredLanguage,
        preferredCurrency,
        transactionTimeRange,
        firstDayOfWeek,
      })

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
  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear cookies
      res.clearCookie('accessToken')
      res.clearCookie('refreshToken')

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
