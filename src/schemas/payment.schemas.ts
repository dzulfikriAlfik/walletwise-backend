/**
 * Payment validation schemas
 */

import { z } from 'zod'

export const createPaymentSchema = z.object({
  targetTier: z.enum(['pro_trial', 'pro', 'pro_plus']),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
  gateway: z.enum(['stripe', 'xendit']),
  method: z.enum(['card', 'invoice', 'va', 'ewallet', 'qris']),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
