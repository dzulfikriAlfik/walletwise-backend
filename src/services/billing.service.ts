/**
 * Billing Service
 * Handles subscription upgrades and dummy payment processing
 */

import { prisma } from '@/config/database'
import { AuthorizationError, ValidationError } from '@/utils/errors'
import {
  WALLET_LIMITS,
  PRO_TRIAL_DAYS,
  SUBSCRIPTION_PRICES,
  type SubscriptionTier,
} from '@/constants/subscription'
import type { UpgradeSubscriptionInput } from '@/schemas/billing.schemas'

export class BillingService {
  /**
   * Upgrade subscription (dummy payment - simulates successful payment)
   */
  async upgradeSubscription(userId: string, input: UpgradeSubscriptionInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) {
      throw new AuthorizationError('User not found')
    }

    const currentTier = (user.subscription?.tier || 'free') as SubscriptionTier

    // Validate upgrade path
    if (input.targetTier === 'pro') {
      if (currentTier === 'pro' || currentTier === 'pro_plus') {
        throw new ValidationError('Already on Pro or higher')
      }
    } else if (input.targetTier === 'pro_plus') {
      if (currentTier === 'pro_plus') {
        throw new ValidationError('Already on Pro+')
      }
    }

    const now = new Date()
    let endDate: Date | null = null
    let trialEndDate: Date | null = null

    if (input.targetTier === 'pro' && input.useTrial) {
      // Pro with 7-day free trial
      trialEndDate = new Date(now.getTime() + PRO_TRIAL_DAYS * 24 * 60 * 60 * 1000)
      endDate = trialEndDate // Trial end = when they need to pay
    } else {
      // Paid upgrade - dummy: set endDate 1 month/year from now
      const months = input.billingPeriod === 'yearly' ? 12 : 1
      endDate = new Date(now)
      endDate.setMonth(endDate.getMonth() + months)
    }

    const updated = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tier: input.targetTier,
        isActive: true,
        startDate: now,
        endDate,
      },
      update: {
        tier: input.targetTier,
        isActive: true,
        startDate: now,
        endDate,
      },
    })

    const price =
      input.targetTier === 'pro'
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
        trialEndDate: input.useTrial ? trialEndDate : null,
      },
      payment: {
        amount: input.useTrial ? 0 : price,
        currency: 'USD',
        billingPeriod: input.billingPeriod,
        isTrial: input.useTrial,
      },
    }
  }

  /**
   * Get subscription plans (for display)
   */
  getPlans() {
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
