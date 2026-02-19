/**
 * Billing Service
 * Handles subscription upgrades and dummy payment processing
 */

import { prisma } from '../config/database.js'
import { AuthorizationError, ValidationError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import {
  WALLET_LIMITS,
  PRO_TRIAL_DAYS,
  SUBSCRIPTION_PRICES,
  type SubscriptionTier,
} from '../constants/subscription.js'
import type { UpgradeSubscriptionInput } from '../schemas/billing.schemas.js'

export class BillingService {
  /**
   * Upgrade subscription (dummy payment - simulates successful payment)
   */
  async upgradeSubscription(userId: string, input: UpgradeSubscriptionInput) {
    logger.info('Billing operation: upgradeSubscription', {
      userId,
      targetTier: input.targetTier,
      billingPeriod: input.billingPeriod,
      useTrial: input.useTrial,
    })
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) {
      throw new AuthorizationError('User not found')
    }

    const currentTier = (user.subscription?.tier || 'free') as SubscriptionTier

    // Normalize target tier
    const isProTrial = input.targetTier === 'pro_trial'
    const targetTier: SubscriptionTier = isProTrial ? 'pro_trial' : (input.targetTier as SubscriptionTier)

    // Validate upgrade path
    if (targetTier === 'pro_trial') {
      // Pro trial only allowed once, from Free plan
      if (currentTier !== 'free') {
        if (currentTier === 'pro_trial') {
          throw new ValidationError(
            'You have already used the Pro free trial. Please upgrade to Pro for unlimited wallets.'
          )
        }
        throw new ValidationError('Pro trial is only available for Free plan')
      }
    } else if (targetTier === 'pro') {
      if (currentTier === 'pro' || currentTier === 'pro_plus') {
        throw new ValidationError('Already on Pro or higher')
      }
    } else if (targetTier === 'pro_plus') {
      if (currentTier === 'pro_plus') {
        throw new ValidationError('Already on Pro+')
      }
    }

    const now = new Date()
    let endDate: Date | null = null

    if (targetTier === 'pro_trial') {
      // Pro trial: 7-day free access, endDate = when trial expires
      endDate = new Date(now.getTime() + PRO_TRIAL_DAYS * 24 * 60 * 60 * 1000)
    } else {
      // Paid upgrade - dummy: set endDate 1 month/year from now
      const months = input.billingPeriod === 'yearly' ? 12 : 1
      endDate = new Date(now)
      endDate.setMonth(endDate.getMonth() + months)
    }

    const rows = await prisma.$queryRaw<
      Array<{
        id: string
        userId: string
        tier: string
        isActive: boolean
        startDate: Date
        endDate: Date | null
        createdAt: Date
        updatedAt: Date
      }>
    >`
      INSERT INTO subscriptions (id, "userId", tier, "isActive", "startDate", "endDate", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${userId}, ${targetTier}, true, ${now}, ${endDate}, NOW(), NOW())
      ON CONFLICT ("userId") DO UPDATE SET
        tier = EXCLUDED.tier,
        "isActive" = EXCLUDED."isActive",
        "startDate" = EXCLUDED."startDate",
        "endDate" = EXCLUDED."endDate",
        "updatedAt" = NOW()
      RETURNING *
    `
    const updated = rows[0]!

    const isPaidPlan = targetTier === 'pro' || targetTier === 'pro_plus'
    const price =
      !isPaidPlan
        ? 0
        : targetTier === 'pro'
          ? input.billingPeriod === 'yearly'
            ? SUBSCRIPTION_PRICES.pro.yearly
            : SUBSCRIPTION_PRICES.pro.monthly
          : input.billingPeriod === 'yearly'
            ? SUBSCRIPTION_PRICES.pro_plus.yearly
            : SUBSCRIPTION_PRICES.pro_plus.monthly

    return {
      subscription: {
        tier: updated.tier,
        isActive: updated.isActive,
        startDate: updated.startDate,
        endDate: updated.endDate,
      },
      payment: {
        amount: price,
        currency: 'USD',
        billingPeriod: input.billingPeriod,
        isTrial: targetTier === 'pro_trial',
      },
    }
  }

  /**
   * Get subscription plans (for display)
   */
  getPlans() {
    logger.info('Billing operation: getPlans')
    return {
      free: {
        tier: 'free',
        name: 'Free',
        maxWallets: WALLET_LIMITS.free,
        features: ['Up to 3 wallets', 'Transaction tracking', 'Basic summary'],
        analytics: false,
        export: false,
      },
      pro: {
        tier: 'pro',
        name: 'Pro',
        maxWallets: null,
        features: [
          'Unlimited wallets',
          'Transaction tracking',
          'Basic summary',
          '7-day free trial',
        ],
        analytics: false,
        export: false,
        prices: SUBSCRIPTION_PRICES.pro,
        trialDays: PRO_TRIAL_DAYS,
      },
      pro_plus: {
        tier: 'pro_plus',
        name: 'Pro+',
        maxWallets: null,
        features: [
          'Unlimited wallets',
          'Advanced analytics',
          'Data export (CSV/Excel)',
          'Transaction tracking',
        ],
        analytics: true,
        export: true,
        prices: SUBSCRIPTION_PRICES.pro_plus,
      },
    }
  }
}

export const billingService = new BillingService()
