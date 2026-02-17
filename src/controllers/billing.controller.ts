/**
 * Billing Controller
 * Handles subscription upgrade and payment endpoints
 */

import type { Request, Response, NextFunction } from 'express'
import { billingService } from '../services/billing.service.js'
import { upgradeSubscriptionSchema, dummyPaymentSchema } from '../schemas/billing.schemas.js'
import { ValidationError } from '../utils/errors.js'
import { formatZodErrors } from '../utils/validation.js'

export class BillingController {
  /**
   * Get available subscription plans
   * GET /api/billing/plans
   */
  async getPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = billingService.getPlans()
      res.status(200).json({
        success: true,
        data: plans,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Upgrade subscription (dummy payment - always succeeds)
   * POST /api/billing/upgrade
   */
  async upgrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      const validationResult = upgradeSubscriptionSchema.safeParse(req.body)
      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error)
        throw new ValidationError('Validation failed', errors)
      }

      const result = await billingService.upgradeSubscription(userId, validationResult.data)

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Dummy payment - simulates payment for upgrade
   * POST /api/billing/dummy-payment
   */
  async dummyPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      const validationResult = dummyPaymentSchema.safeParse(req.body)
      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error)
        throw new ValidationError('Validation failed', errors)
      }

      // Dummy payment always succeeds - upgrade subscription
      const result = await billingService.upgradeSubscription(userId, {
        targetTier: validationResult.data.targetTier,
        billingPeriod: validationResult.data.billingPeriod,
        useTrial: validationResult.data.targetTier === 'pro',
      })

      res.status(200).json({
        success: true,
        data: {
          ...result,
          paymentStatus: 'completed',
          transactionId: `dummy_${Date.now()}`,
        },
      })
    } catch (error) {
      next(error)
    }
  }
}

export const billingController = new BillingController()
