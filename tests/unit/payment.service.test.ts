/**
 * Unit tests for Payment Service
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import { createMockUser, createMockSubscription, createMockPayment } from '../helpers'

import { paymentService } from '../../src/services/payment.service'

describe('PaymentService', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('createPayment', () => {
    it('should activate pro_trial for free user', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'free' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)
      prismaMock.subscription.upsert.mockResolvedValue(
        createMockSubscription({ tier: 'pro_trial' })
      )

      const result = await paymentService.createPayment({
        userId: 'test-user-id',
        targetTier: 'pro_trial',
        billingPeriod: 'monthly',
        gateway: 'stripe',
        method: 'card',
      })

      expect(result.status).toBe('paid')
      expect(result.subscription?.tier).toBe('pro_trial')
      expect(prismaMock.subscription.upsert).toHaveBeenCalled()
    })

    it('should throw when pro_trial already used', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'pro_trial' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)

      await expect(
        paymentService.createPayment({
          userId: 'test-user-id',
          targetTier: 'pro_trial',
          billingPeriod: 'monthly',
          gateway: 'stripe',
          method: 'card',
        })
      ).rejects.toThrow('already used')
    })

    it('should throw when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      await expect(
        paymentService.createPayment({
          userId: 'nonexistent',
          targetTier: 'pro',
          billingPeriod: 'monthly',
          gateway: 'stripe',
          method: 'card',
        })
      ).rejects.toThrow('User not found')
    })
  })

  describe('activateSubscriptionFromWebhook', () => {
    it('should activate subscription when payment found and pending', async () => {
      const payment = createMockPayment({
        id: 'pay-1',
        gatewayRef: 'cs_123',
        status: 'pending',
        userId: 'test-user-id',
        targetTier: 'pro',
        billingPeriod: 'monthly',
      })
      prismaMock.payment.findUnique.mockResolvedValue({
        ...payment,
        user: createMockUser(),
      })
      prismaMock.payment.update.mockResolvedValue(payment)
      prismaMock.subscription.upsert.mockResolvedValue({})

      const result = await paymentService.activateSubscriptionFromWebhook({
        gatewayRef: 'cs_123',
        gateway: 'stripe',
        status: 'paid',
        rawWebhook: {},
      })

      expect(result).toEqual({ userId: 'test-user-id', tier: 'pro' })
      expect(prismaMock.subscription.upsert).toHaveBeenCalled()
    })

    it('should return undefined when payment not found', async () => {
      prismaMock.payment.findUnique.mockResolvedValue(null)

      const result = await paymentService.activateSubscriptionFromWebhook({
        gatewayRef: 'nonexistent',
        gateway: 'stripe',
        status: 'paid',
        rawWebhook: {},
      })

      expect(result).toBeUndefined()
    })

    it('should return undefined when payment already paid (idempotent)', async () => {
      const payment = createMockPayment({
        gatewayRef: 'cs_123',
        status: 'paid',
      })
      prismaMock.payment.findUnique.mockResolvedValue({
        ...payment,
        user: createMockUser(),
      })

      const result = await paymentService.activateSubscriptionFromWebhook({
        gatewayRef: 'cs_123',
        gateway: 'stripe',
        status: 'paid',
        rawWebhook: {},
      })

      expect(result).toBeUndefined()
      expect(prismaMock.subscription.upsert).not.toHaveBeenCalled()
    })
  })

  describe('createPayment - gateway branches', () => {
    it('should throw for invalid gateway', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'free' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)

      await expect(
        paymentService.createPayment({
          userId: 'test-user-id',
          targetTier: 'pro',
          billingPeriod: 'monthly',
          gateway: 'invalid' as 'stripe',
          method: 'card',
        })
      ).rejects.toThrow('Invalid payment gateway')
    })

    it('should return idempotent result when payment already exists', async () => {
      const { createStripeCheckout } = await import(
        '../../src/gateways/stripe.gateway'
      )
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'free' }),
      })
      const existingPayment = createMockPayment({
        gatewayRef: 'cs_existing',
        status: 'pending',
      })
      prismaMock.user.findUnique.mockResolvedValue(user)
      ;(createStripeCheckout as jest.Mock).mockResolvedValue({
        paymentId: 'cs_existing',
        gatewayRef: 'cs_existing',
        status: 'pending',
        redirectUrl: 'https://checkout.stripe.com/xxx',
      })
      prismaMock.payment.findUnique.mockResolvedValue(existingPayment)

      const result = await paymentService.createPayment({
        userId: 'test-user-id',
        targetTier: 'pro',
        billingPeriod: 'monthly',
        gateway: 'stripe',
        method: 'card',
      })

      expect(result.message).toContain('idempotent')
      expect(prismaMock.payment.create).not.toHaveBeenCalled()
    })

    it('should create Xendit payment', async () => {
      const { createXenditInvoice } = await import(
        '../../src/gateways/xendit.gateway'
      )
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'free' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)
      prismaMock.payment.findFirst.mockResolvedValue(null)
      prismaMock.payment.findUnique.mockResolvedValue(null)
      prismaMock.payment.create.mockResolvedValue(
        createMockPayment({ gatewayRef: 'inv_123' })
      )
      ;(createXenditInvoice as jest.Mock).mockResolvedValue({
        paymentId: 'inv_123',
        gatewayRef: 'inv_123',
        status: 'pending',
        invoiceUrl: 'https://invoice.xendit.co/xxx',
      })

      const result = await paymentService.createPayment({
        userId: 'test-user-id',
        targetTier: 'pro',
        billingPeriod: 'yearly',
        gateway: 'xendit',
        method: 'invoice',
      })

      expect(result.gatewayRef).toBe('inv_123')
      expect(result.invoiceUrl).toBeDefined()
    })

    it('should reuse existing Xendit pending invoice when not expired', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'free' }),
      })
      const futureExpiry = new Date()
      futureExpiry.setHours(futureExpiry.getHours() + 2)
      const existingPending = createMockPayment({
        id: 'pay-pending',
        gatewayRef: 'inv_123',
        gateway: 'xendit',
        status: 'pending',
        targetTier: 'pro',
        billingPeriod: 'monthly',
        invoiceUrl: 'https://invoice.xendit.co/existing',
        expiresAt: futureExpiry,
        rawResponse: { invoiceUrl: 'https://invoice.xendit.co/existing' },
      })
      prismaMock.user.findUnique.mockResolvedValue(user)
      prismaMock.payment.findFirst.mockResolvedValue(existingPending)

      const result = await paymentService.createPayment({
        userId: 'test-user-id',
        targetTier: 'pro',
        billingPeriod: 'monthly',
        gateway: 'xendit',
        method: 'invoice',
      })

      expect(result.message).toContain('Reusing existing')
      expect(result.invoiceUrl).toBe('https://invoice.xendit.co/existing')
      expect(result.paymentId).toBe('pay-pending')
    })

    it('should create pro_plus yearly payment', async () => {
      const { createStripeCheckout } = await import(
        '../../src/gateways/stripe.gateway'
      )
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'free' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)
      prismaMock.payment.findUnique.mockResolvedValue(null)
      prismaMock.payment.create.mockResolvedValue(
        createMockPayment({ gatewayRef: 'cs_proplus' })
      )
      ;(createStripeCheckout as jest.Mock).mockResolvedValue({
        paymentId: 'cs_proplus',
        gatewayRef: 'cs_proplus',
        status: 'pending',
        redirectUrl: 'https://checkout.stripe.com/xxx',
      })

      const result = await paymentService.createPayment({
        userId: 'test-user-id',
        targetTier: 'pro_plus',
        billingPeriod: 'yearly',
        gateway: 'stripe',
        method: 'card',
      })

      expect(result.gatewayRef).toBe('cs_proplus')
    })
  })
})
