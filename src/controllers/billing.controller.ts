/**
 * Billing Controller
 * Handles subscription plans (payment via /payments/create)
 */

import type { Request, Response, NextFunction } from 'express'
import { billingService } from '../services/billing.service.js'

export class BillingController {
  /**
   * Get available subscription plans
   * GET /api/v1/billing/plans
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
}

export const billingController = new BillingController()
