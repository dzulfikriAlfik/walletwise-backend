/**
 * Stripe Payment Gateway
 * Handles card and subscription payments via Stripe Checkout
 */

import Stripe from 'stripe'
import { env } from '../config/env.js'
import type { CreatePaymentInput, CreatePaymentResult } from '../types/payment.js'

let stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!stripe) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-01-28.clover' })
  }
  return stripe
}

const PRICE_IDS: Record<string, string> = {
  pro_monthly: env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: env.STRIPE_PRICE_PRO_YEARLY,
  pro_plus_monthly: env.STRIPE_PRICE_PRO_PLUS_MONTHLY,
  pro_plus_yearly: env.STRIPE_PRICE_PRO_PLUS_YEARLY,
}

export async function createStripeCheckout(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const s = getStripe()

  // Pro trial: no payment, handled separately
  if (input.targetTier === 'pro_trial') {
    throw new Error('Pro trial does not use Stripe - use direct activation')
  }

  const priceKey = `${input.targetTier}_${input.billingPeriod}` as keyof typeof PRICE_IDS
  const priceId = PRICE_IDS[priceKey]
  if (!priceId) {
    throw new Error(`Stripe price not configured for ${priceKey}`)
  }

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${env.FRONTEND_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/billing?canceled=true`,
    client_reference_id: input.userId,
    metadata: {
      userId: input.userId,
      targetTier: input.targetTier,
      billingPeriod: input.billingPeriod,
    },
  })

  return {
    paymentId: session.id,
    gatewayRef: session.id,
    status: 'pending',
    redirectUrl: session.url ?? undefined,
    expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : undefined,
  }
}
