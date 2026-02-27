/**
 * API integration tests for Webhook endpoints (Stripe, Xendit)
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import { createMockPayment, createMockUser } from '../helpers'

import Stripe from 'stripe'
import supertest from 'supertest'
import app from '../../src/app'

const request = supertest(app)

describe('Webhook API Endpoints', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('POST /webhook/stripe', () => {
    it('should return 400 when missing signature', async () => {
      const res = await request
        .post('/webhook/stripe')
        .set('Content-Type', 'application/json')
        .send(Buffer.from('{}'))
        .expect(400)

      expect(res.body.error).toBeDefined()
    })

    it('should return 400 when signature verification fails', async () => {
      const res = await request
        .post('/webhook/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', 'invalid-signature')
        .send(Buffer.from('{"id":"evt_123","type":"checkout.session.completed"}'))
        .expect(400)

      expect(res.body.error).toContain('signature')
    })

    it('should return 200 when event is valid and processed', async () => {
      const payload = JSON.stringify({
        id: 'evt_test',
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_test_123' } },
      })
      const secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_fake'
      const sig = Stripe.webhooks.generateTestHeaderString({ payload, secret })

      const payment = createMockPayment({
        id: 'pay-1',
        gatewayRef: 'cs_test_123',
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

      const res = await request
        .post('/webhook/stripe')
        .set('Content-Type', 'application/json')
        .set('stripe-signature', sig)
        .send(payload)
        .expect(200)

      expect(res.body.received).toBe(true)
    })
  })

  describe('POST /webhook/xendit', () => {
    it('should return 200 for valid PAID payload', async () => {
      const payment = createMockPayment({
        id: 'pay-1',
        gatewayRef: 'inv_123',
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

      const res = await request
        .post('/webhook/xendit')
        .set('Content-Type', 'application/json')
        .set('x-callback-token', process.env.XENDIT_WEBHOOK_TOKEN || 'webhook_test_fake')
        .send({
          external_id: 'inv_123',
          status: 'PAID',
          id: 'xendit_123',
        })
        .expect(200)

      expect(res.body.received).toBe(true)
    })

    it('should return 200 for non-PAID payload (no activation)', async () => {
      const res = await request
        .post('/webhook/xendit')
        .set('Content-Type', 'application/json')
        .set('x-callback-token', process.env.XENDIT_WEBHOOK_TOKEN || 'webhook_test_fake')
        .send({
          external_id: 'inv_123',
          status: 'PENDING',
        })
        .expect(200)

      expect(res.body.received).toBe(true)
    })
  })
})
