/**
 * Subscription Middleware
 * Checks user subscription tier for Pro+ features
 */

import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../config/database.js'
import { AuthorizationError } from '../utils/errors.js'

/**
 * Require Pro+ subscription (analytics, export)
 * Must be used after verifyToken
 */
export const requireProPlus = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      throw new AuthorizationError('Authentication required')
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    })

    const tier = subscription?.tier ?? 'free'

    if (tier !== 'pro_plus') {
      throw new AuthorizationError(
        'Pro+ subscription required for this feature. Please upgrade at /billing.'
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}
