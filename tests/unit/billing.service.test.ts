/**
 * Unit tests for BillingService
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import { createMockUser, createMockSubscription } from '../helpers'

import { BillingService } from '../../src/services/billing.service'

describe('BillingService', () => {
  let billingService: BillingService

  beforeEach(() => {
    resetAllMocks()
    billingService = new BillingService()
  })

  describe('getPlans', () => {
    it('should return all subscription plans', () => {
      const plans = billingService.getPlans()

      expect(plans).toHaveProperty('free')
      expect(plans).toHaveProperty('pro')
      expect(plans).toHaveProperty('pro_plus')

      expect(plans.free.tier).toBe('free')
      expect(plans.free.maxWallets).toBe(3)

      expect(plans.pro.tier).toBe('pro')
      expect(plans.pro.maxWallets).toBeNull()

      expect(plans.pro_plus.tier).toBe('pro_plus')
      expect(plans.pro_plus.analytics).toBe(true)
      expect(plans.pro_plus.export).toBe(true)
    })

    it('should include pricing for paid plans', () => {
      const plans = billingService.getPlans()

      expect(plans.pro.prices).toEqual({ monthly: 9.99, yearly: 99.99 })
      expect(plans.pro_plus.prices).toEqual({ monthly: 19.99, yearly: 199.99 })
    })
  })

  describe('upgradeSubscription', () => {
    it('should allow free user to start Pro trial', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'free' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)
      prismaMock.$queryRaw.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'test-user-id',
          tier: 'pro_trial',
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])

      const result = await billingService.upgradeSubscription('test-user-id', {
        targetTier: 'pro_trial',
        billingPeriod: 'monthly',
        useTrial: false,
      })

      expect(result.subscription.tier).toBe('pro_trial')
      expect(result.payment.isTrial).toBe(true)
      expect(result.payment.amount).toBe(0)
    })

    it('should reject Pro trial if user already used it', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'pro_trial' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)

      await expect(
        billingService.upgradeSubscription('test-user-id', {
          targetTier: 'pro_trial',
          billingPeriod: 'monthly',
          useTrial: false,
        })
      ).rejects.toThrow(/already used the Pro free trial/)
    })

    it('should reject if already on Pro or higher and trying to upgrade to Pro', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'pro' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)

      await expect(
        billingService.upgradeSubscription('test-user-id', {
          targetTier: 'pro',
          billingPeriod: 'monthly',
          useTrial: false,
        })
      ).rejects.toThrow('Already on Pro or higher')
    })

    it('should throw if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      await expect(
        billingService.upgradeSubscription('nonexistent-id', {
          targetTier: 'pro',
          billingPeriod: 'monthly',
          useTrial: false,
        })
      ).rejects.toThrow('User not found')
    })

    it('should reject Pro trial if user is on Pro', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'pro' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)

      await expect(
        billingService.upgradeSubscription('test-user-id', {
          targetTier: 'pro_trial',
          billingPeriod: 'monthly',
          useTrial: false,
        })
      ).rejects.toThrow(/Pro trial is only available for Free plan/)
    })

    it('should upgrade free user to Pro yearly', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'free' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)
      prismaMock.$queryRaw.mockResolvedValue([
        {
          id: 'sub-1',
          userId: 'test-user-id',
          tier: 'pro',
          isActive: true,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])

      const result = await billingService.upgradeSubscription('test-user-id', {
        targetTier: 'pro',
        billingPeriod: 'yearly',
        useTrial: false,
      })

      expect(result.subscription.tier).toBe('pro')
      expect(result.payment.amount).toBe(99.99)
      expect(result.payment.billingPeriod).toBe('yearly')
    })

    it('should reject if already on Pro+ and trying to upgrade to Pro+', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'pro_plus' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)

      await expect(
        billingService.upgradeSubscription('test-user-id', {
          targetTier: 'pro_plus',
          billingPeriod: 'monthly',
          useTrial: false,
        })
      ).rejects.toThrow('Already on Pro+')
    })
  })
})
