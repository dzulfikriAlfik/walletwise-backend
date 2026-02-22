/**
 * Subscription Middleware
 * Checks user subscription tier for feature gating
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

/**
 * Require Pro or active Pro Trial (custom categories, unlimited wallets)
 * Pro Trial is considered active when endDate > now
 * Must be used after verifyToken
 */
export const requireProOrActiveTrial = async (
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

    let tier = (subscription?.tier ?? 'free').toString().toLowerCase().replace(/-/g, '_').trim()

    if (tier === 'pro_trial') {
      const endDate = subscription?.endDate
      if (endDate) {
        const end = new Date(endDate)
        const now = new Date()
        if (!Number.isNaN(end.getTime()) && end.getTime() < now.getTime()) {
          tier = 'free'
        }
      }
    }

    const allowed = ['pro', 'pro_plus'].includes(tier) || tier === 'pro_trial'

    if (!allowed) {
      throw new AuthorizationError(
        'Pro subscription or active Pro Trial required. Please upgrade at /billing.'
      )
    }

    next()
  } catch (error) {
    next(error)
  }
}
