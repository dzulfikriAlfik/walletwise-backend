/**
 * Billing/Payment validation schemas
 */

import { z } from 'zod'

export const upgradeSubscriptionSchema = z.object({
  targetTier: z.enum(['pro', 'pro_plus']),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
  useTrial: z.boolean().optional().default(false), // For Pro: use 7-day free trial
})

export const dummyPaymentSchema = z.object({
  targetTier: z.enum(['pro', 'pro_plus']),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
  cardNumber: z.string().optional(), // Dummy - not validated
  expiry: z.string().optional(),
  cvv: z.string().optional(),
})

export type UpgradeSubscriptionInput = z.infer<typeof upgradeSubscriptionSchema>
export type DummyPaymentInput = z.infer<typeof dummyPaymentSchema>
