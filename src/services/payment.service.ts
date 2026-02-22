/**
 * Payment Service
 * Unified payment creation and webhook handling
 * All subscription activation happens ONLY via webhook
 */

import { prisma } from '../config/database.js'
import { ValidationError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import {
  PRO_TRIAL_DAYS,
  SUBSCRIPTION_PRICES,
  type SubscriptionTier,
} from '../constants/subscription.js'
import { createStripeCheckout } from '../gateways/stripe.gateway.js'
import { createXenditInvoice } from '../gateways/xendit.gateway.js'
import type { CreatePaymentInput } from '../types/payment.js'

export class PaymentService {
  /**
   * Create payment - unified endpoint for Stripe and Xendit
   */
  async createPayment(input: CreatePaymentInput) {
    logger.info('Payment create', {
      userId: input.userId,
      gateway: input.gateway,
      method: input.method,
      targetTier: input.targetTier,
    })

    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      include: { subscription: true },
    })
    if (!user) throw new ValidationError('User not found')

    const currentTier = (user.subscription?.tier || 'free') as SubscriptionTier

    // Pro trial: direct activation (no payment gateway)
    if (input.targetTier === 'pro_trial') {
      if (currentTier !== 'free') {
        if (currentTier === 'pro_trial') {
          throw new ValidationError('You have already used the Pro free trial.')
        }
        throw new ValidationError('Pro trial is only available for Free plan')
      }
      const endDate = new Date(Date.now() + PRO_TRIAL_DAYS * 24 * 60 * 60 * 1000)
      await prisma.subscription.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          tier: 'pro_trial',
          isActive: true,
          endDate,
        },
        update: {
          tier: 'pro_trial',
          isActive: true,
          startDate: new Date(),
          endDate,
          updatedAt: new Date(),
        },
      })
      return {
        paymentId: `trial_${input.userId}`,
        gatewayRef: `trial_${input.userId}`,
        status: 'paid' as const,
        redirectUrl: undefined,
        invoiceUrl: undefined,
        subscription: {
          tier: 'pro_trial',
          isActive: true,
          endDate: endDate.toISOString(),
        },
      }
    }

    // Paid plans: use gateway
    let result: { paymentId: string; gatewayRef: string; status: string; redirectUrl?: string; invoiceUrl?: string; expiresAt?: Date }
    let rawRequest: unknown
    let rawResponse: unknown

    if (input.gateway === 'stripe') {
      result = await createStripeCheckout(input)
      rawRequest = { userId: input.userId, targetTier: input.targetTier, billingPeriod: input.billingPeriod }
      rawResponse = { sessionId: result.paymentId, url: result.redirectUrl }
    } else if (input.gateway === 'xendit') {
      result = await createXenditInvoice(input)
      rawRequest = { userId: input.userId, targetTier: input.targetTier, billingPeriod: input.billingPeriod }
      rawResponse = { invoiceUrl: result.invoiceUrl, externalId: result.gatewayRef }
    } else {
      throw new ValidationError('Invalid payment gateway')
    }

    const amount =
      input.targetTier === 'pro'
        ? input.billingPeriod === 'yearly'
          ? SUBSCRIPTION_PRICES.pro.yearly
          : SUBSCRIPTION_PRICES.pro.monthly
        : input.billingPeriod === 'yearly'
          ? SUBSCRIPTION_PRICES.pro_plus.yearly
          : SUBSCRIPTION_PRICES.pro_plus.monthly

    // Idempotency: check if payment with same gatewayRef already exists
    const existing = await prisma.payment.findUnique({
      where: { gatewayRef: result.gatewayRef },
    })
    if (existing) {
      return {
        paymentId: existing.id,
        gatewayRef: existing.gatewayRef,
        status: existing.status,
        redirectUrl: result.redirectUrl,
        invoiceUrl: result.invoiceUrl,
        message: 'Payment already created (idempotent)',
      }
    }

    await prisma.payment.create({
      data: {
        userId: input.userId,
        gateway: input.gateway,
        gatewayRef: result.gatewayRef,
        method: input.method,
        status: result.status,
        amount,
        currency: input.gateway === 'xendit' ? 'IDR' : 'USD',
        targetTier: input.targetTier,
        billingPeriod: input.billingPeriod,
        rawRequest: rawRequest as object,
        rawResponse: rawResponse as object,
      },
    })

    return {
      paymentId: result.paymentId,
      gatewayRef: result.gatewayRef,
      status: result.status,
      redirectUrl: result.redirectUrl,
      invoiceUrl: result.invoiceUrl,
      expiresAt: result.expiresAt?.toISOString(),
    }
  }

  /**
   * Activate subscription from webhook (idempotent)
   * Called ONLY by webhook handlers after signature verification
   */
  async activateSubscriptionFromWebhook(params: {
    gatewayRef: string
    gateway: 'stripe' | 'xendit'
    status: 'paid'
    rawWebhook: object
  }) {
    const payment = await prisma.payment.findUnique({
      where: { gatewayRef: params.gatewayRef },
      include: { user: true },
    })
    if (!payment) {
      logger.warn('Webhook: payment not found', { gatewayRef: params.gatewayRef })
      return
    }

    // Idempotency: already paid
    if (payment.status === 'paid') {
      logger.info('Webhook: payment already processed (idempotent)', { gatewayRef: params.gatewayRef })
      return
    }

    // Update payment
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: params.status,
        rawWebhook: params.rawWebhook,
        updatedAt: new Date(),
      },
    })

    const now = new Date()
    const months = payment.billingPeriod === 'yearly' ? 12 : 1
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + months)

    await prisma.subscription.upsert({
      where: { userId: payment.userId },
      create: {
        userId: payment.userId,
        tier: payment.targetTier,
        isActive: true,
        startDate: now,
        endDate,
      },
      update: {
        tier: payment.targetTier,
        isActive: true,
        startDate: now,
        endDate,
        updatedAt: now,
      },
    })

    logger.info('Subscription activated via webhook', {
      userId: payment.userId,
      tier: payment.targetTier,
      gatewayRef: params.gatewayRef,
    })

    return { userId: payment.userId, tier: payment.targetTier }
  }
}

export const paymentService = new PaymentService()
