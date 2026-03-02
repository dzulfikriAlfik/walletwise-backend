/**
 * Webhook Controller
 * Handles Stripe, Xendit, and Midtrans webhooks with signature verification
 * All payment status updates ONLY from webhooks
 */

import crypto from 'node:crypto'
import type { Request, Response } from 'express'
import Stripe from 'stripe'
import { env } from '../config/env.js'
import { paymentService } from '../services/payment.service.js'
import { logger } from '../utils/logger.js'

export class WebhookController {
  /**
   * Stripe webhook - requires raw body for signature verification
   */
  async stripe(req: Request, res: Response): Promise<void> {
    const sig = req.headers['stripe-signature'] as string | undefined
    // express.raw() puts raw body in req.body
    const rawBody = req.body as Buffer | undefined

    if (!rawBody || !Buffer.isBuffer(rawBody) || !sig) {
      logger.warn('Stripe webhook: missing signature or body')
      res.status(400).json({ error: 'Missing signature or body' })
      return
    }

    if (!env.STRIPE_WEBHOOK_SECRET) {
      logger.error('Stripe webhook: STRIPE_WEBHOOK_SECRET not configured')
      res.status(500).json({ error: 'Webhook not configured' })
      return
    }

    let event: Stripe.Event
    try {
      event = Stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logger.warn('Stripe webhook: signature verification failed', { error: msg })
      res.status(400).json({ error: `Webhook signature verification failed: ${msg}` })
      return
    }

    logger.info('Stripe webhook received', { type: event.type, id: event.id })

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const gatewayRef = session.id

      const result = await paymentService.activateSubscriptionFromWebhook({
        gatewayRef,
        gateway: 'stripe',
        status: 'paid',
        rawWebhook: event as unknown as object,
      })

      if (result) {
        // Emit to Socket.IO for realtime update (handled in index.ts)
        const io = (global as unknown as { io?: { to: (room: string) => { emit: (ev: string, data: unknown) => void } } }).io
        if (io) {
          io.to(`user:${result.userId}`).emit('subscription:updated', {
            tier: result.tier,
            isActive: true,
          })
        }
      }
    }

    res.status(200).json({ received: true })
  }

  /**
   * Xendit webhook - uses callback token verification
   */
  async xendit(req: Request, res: Response): Promise<void> {
    const callbackToken = req.headers['x-callback-token'] as string | undefined

    if (env.XENDIT_WEBHOOK_TOKEN && callbackToken !== env.XENDIT_WEBHOOK_TOKEN) {
      logger.warn('Xendit webhook: token verification failed')
      res.status(400).json({ error: 'Invalid callback token' })
      return
    }

    const payload = req.body as {
      external_id?: string
      status?: string
      id?: string
    }

    logger.info('Xendit webhook received', { externalId: payload.external_id, status: payload.status })

    if (payload.status === 'PAID' && payload.external_id) {
      const gatewayRef = payload.external_id

      const result = await paymentService.activateSubscriptionFromWebhook({
        gatewayRef,
        gateway: 'xendit',
        status: 'paid',
        rawWebhook: payload,
      })

      if (result) {
        const io = (global as unknown as { io?: { to: (room: string) => { emit: (ev: string, data: unknown) => void } } }).io
        if (io) {
          io.to(`user:${result.userId}`).emit('subscription:updated', {
            tier: result.tier,
            isActive: true,
          })
        }
      }
    }

    res.status(200).json({ received: true })
  }

  /**
   * Midtrans webhook - uses signature_key verification
   * Signature: SHA512(order_id + status_code + gross_amount + serverKey)
   */
  async midtrans(req: Request, res: Response): Promise<void> {
    const payload = req.body as {
      order_id?: string
      transaction_status?: string
      status_code?: string
      gross_amount?: string
      signature_key?: string
    }

    if (!payload.order_id || !payload.transaction_status) {
      logger.warn('Midtrans webhook: missing order_id or transaction_status')
      res.status(400).json({ error: 'Invalid payload' })
      return
    }

    if (env.MIDTRANS_SERVER_KEY) {
      const orderId = payload.order_id
      const statusCode = payload.status_code ?? ''
      const grossAmount = payload.gross_amount ?? ''
      const serverKey = env.MIDTRANS_SERVER_KEY
      const expectedSignature = crypto
        .createHash('sha512')
        .update(orderId + statusCode + grossAmount + serverKey)
        .digest('hex')

      if (payload.signature_key !== expectedSignature) {
        logger.warn('Midtrans webhook: signature verification failed')
        res.status(400).json({ error: 'Invalid signature' })
        return
      }
    }

    logger.info('Midtrans webhook received', {
      orderId: payload.order_id,
      transactionStatus: payload.transaction_status,
    })

    // settlement = paid (bank transfer, e-wallet, etc.), capture = paid (card)
    const isPaid =
      payload.transaction_status === 'settlement' || payload.transaction_status === 'capture'

    if (isPaid && payload.order_id) {
      const gatewayRef = payload.order_id

      const result = await paymentService.activateSubscriptionFromWebhook({
        gatewayRef,
        gateway: 'midtrans',
        status: 'paid',
        rawWebhook: payload,
      })

      if (result) {
        const io = (global as unknown as { io?: { to: (room: string) => { emit: (ev: string, data: unknown) => void } } }).io
        if (io) {
          io.to(`user:${result.userId}`).emit('subscription:updated', {
            tier: result.tier,
            isActive: true,
          })
        }
      }
    }

    res.status(200).json({ received: true })
  }
}

export const webhookController = new WebhookController()
