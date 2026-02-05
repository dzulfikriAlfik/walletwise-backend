/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '@/utils/jwt'
import { AuthenticationError } from '@/utils/errors'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        email: string
      }
    }
  }
}

/**
 * Verify JWT token from httpOnly cookie
 * Attaches user payload to request object
 */
export const verifyToken = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    // Get token from cookie
    const token = req.cookies.accessToken

    if (!token) {
      throw new AuthenticationError('Access token missing')
    }

    // Verify token
    const payload = verifyAccessToken(token)

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    }

    next()
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error)
    } else {
      next(new AuthenticationError('Invalid or expired token'))
    }
  }
}

/**
 * Optional auth middleware - doesn't throw if token is missing
 * Attaches user if valid token is provided
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = req.cookies.accessToken

    if (!token) {
      return next()
    }

    const payload = verifyAccessToken(token)

    req.user = {
      userId: payload.userId,
      email: payload.email,
    }

    next()
  } catch (error) {
    // Silently fail for optional auth
    next()
  }
}
