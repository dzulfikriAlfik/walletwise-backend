/**
 * API integration tests for Payment endpoints
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import {
  createMockUser,
  createMockSubscription,
  createMockPayment,
  generateTestAccessToken,
} from '../helpers'

import supertest from 'supertest'
import app from '../../src/app'

const request = supertest(app)

describe('Payment API Endpoints', () => {
  const token = generateTestAccessToken()

  beforeEach(() => {
    resetAllMocks()
  })

  describe('POST /api/v1/payments/create', () => {
    it('should return 401 without auth', async () => {
      await request
        .post('/api/v1/payments/create')
        .send({
          targetTier: 'pro',
          billingPeriod: 'monthly',
          gateway: 'stripe',
          method: 'card',
        })
        .expect(401)
    })

    it('should return 200 for Pro trial (no gateway)', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'free' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)
      prismaMock.subscription.upsert.mockResolvedValue(
        createMockSubscription({ tier: 'pro_trial' })
      )

      const res = await request
        .post('/api/v1/payments/create')
        .set('Cookie', `accessToken=${token}`)
        .send({
          targetTier: 'pro_trial',
          billingPeriod: 'monthly',
          gateway: 'stripe',
          method: 'card',
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('paid')
      expect(res.body.data.subscription.tier).toBe('pro_trial')
    })

    it('should return 400 for Pro trial when already used', async () => {
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'pro_trial' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)

      const res = await request
        .post('/api/v1/payments/create')
        .set('Cookie', `accessToken=${token}`)
        .send({
          targetTier: 'pro_trial',
          billingPeriod: 'monthly',
          gateway: 'stripe',
          method: 'card',
        })
        .expect(400)

      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 200 for Stripe checkout', async () => {
      const { createStripeCheckout } = await import(
        '../../src/gateways/stripe.gateway'
      )
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'free' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)
      prismaMock.payment.findUnique.mockResolvedValue(null)
      prismaMock.payment.create.mockResolvedValue(
        createMockPayment({ gatewayRef: 'cs_test_123' })
      )
      ;(createStripeCheckout as jest.Mock).mockResolvedValue({
        paymentId: 'cs_test_123',
        gatewayRef: 'cs_test_123',
        status: 'pending',
        redirectUrl: 'https://checkout.stripe.com/xxx',
      })

      const res = await request
        .post('/api/v1/payments/create')
        .set('Cookie', `accessToken=${token}`)
        .send({
          targetTier: 'pro',
          billingPeriod: 'monthly',
          gateway: 'stripe',
          method: 'card',
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.redirectUrl).toBeDefined()
    })

    it('should return 200 for Xendit payment', async () => {
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

      const res = await request
        .post('/api/v1/payments/create')
        .set('Cookie', `accessToken=${token}`)
        .send({
          targetTier: 'pro',
          billingPeriod: 'yearly',
          gateway: 'xendit',
          method: 'invoice',
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.invoiceUrl).toBeDefined()
    })

    it('should return 200 for Midtrans payment', async () => {
      const { createMidtransSnapTransaction } = await import(
        '../../src/gateways/midtrans.gateway'
      )
      const user = createMockUser({
        subscription: createMockSubscription({ tier: 'free' }),
      })
      prismaMock.user.findUnique.mockResolvedValue(user)
      prismaMock.payment.findUnique.mockResolvedValue(null)
      prismaMock.payment.create.mockResolvedValue(
        createMockPayment({ gatewayRef: 'wlw_test_123' })
      )
      ;(createMidtransSnapTransaction as jest.Mock).mockResolvedValue({
        paymentId: 'snap_token_xxx',
        gatewayRef: 'wlw_test_123',
        status: 'pending',
        redirectUrl: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/xxx',
      })

      const res = await request
        .post('/api/v1/payments/create')
        .set('Cookie', `accessToken=${token}`)
        .send({
          targetTier: 'pro',
          billingPeriod: 'monthly',
          gateway: 'midtrans',
          method: 'invoice',
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.redirectUrl).toBeDefined()
    })

    it('should return 400 for invalid validation', async () => {
      const res = await request
        .post('/api/v1/payments/create')
        .set('Cookie', `accessToken=${token}`)
        .send({
          targetTier: 'invalid',
          gateway: 'stripe',
          method: 'card',
        })
        .expect(400)

      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })
  })
})
