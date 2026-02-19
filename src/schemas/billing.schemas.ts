/**
 * Billing/Payment validation schemas
 */

import { z } from 'zod'

export const upgradeSubscriptionSchema = z.object({
  // targetTier:
  // - pro_trial: 7-day free trial with Pro features
  // - pro: paid Pro
  // - pro_plus: paid Pro+
  targetTier: z.enum(['pro_trial', 'pro', 'pro_plus']),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
  // Deprecated: trial is now represented by targetTier = 'pro_trial'
  useTrial: z.boolean().optional().default(false),
})

export const dummyPaymentSchema = z.object({
  targetTier: z.enum(['pro_trial', 'pro', 'pro_plus']),
  billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
  cardNumber: z.string().optional(), // Dummy fields - validated at UI level
  expiry: z.string().optional(),
  cvv: z.string().optional(),
})

export type UpgradeSubscriptionInput = z.infer<typeof upgradeSubscriptionSchema>
export type DummyPaymentInput = z.infer<typeof dummyPaymentSchema>
