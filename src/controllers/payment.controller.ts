/**
 * Payment Controller
 * Unified payment creation endpoint
 */

import type { Request, Response, NextFunction } from 'express'
import { paymentService } from '../services/payment.service.js'
import { createPaymentSchema } from '../schemas/payment.schemas.js'
import { ValidationError } from '../utils/errors.js'
import { formatZodErrors } from '../utils/validation.js'

export class PaymentController {
  /**
   * Create payment - POST /api/v1/payments/create
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId
      if (!userId) {
        throw new ValidationError('User ID not found in request')
      }

      const validationResult = createPaymentSchema.safeParse(req.body)
      if (!validationResult.success) {
        const errors = formatZodErrors(validationResult.error)
        throw new ValidationError('Validation failed', errors)
      }

      const { targetTier, billingPeriod, gateway, method } = validationResult.data

      const result = await paymentService.createPayment({
        userId,
        targetTier,
        billingPeriod,
        gateway,
        method,
      })

      res.status(200).json({
        success: true,
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }
}

export const paymentController = new PaymentController()
