/**
 * Subscription tier constants
 * free: 3 wallets
 * pro: unlimited wallets (+ 7-day free trial)
 * pro_plus: unlimited wallets + analytics + export
 */

export const SUBSCRIPTION_TIERS = ['free', 'pro', 'pro_plus'] as const
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number]

export const WALLET_LIMITS: Record<SubscriptionTier, number | null> = {
  free: 3,
  pro: null, // unlimited
  pro_plus: null, // unlimited
}

export const PRO_TRIAL_DAYS = 7

export const SUBSCRIPTION_PRICES = {
  pro: { monthly: 9.99, yearly: 99.99 },
  pro_plus: { monthly: 19.99, yearly: 199.99 },
} as const
