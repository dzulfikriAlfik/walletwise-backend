/**
 * Midtrans Payment Gateway
 * Handles Snap payments: VA, E-wallet, QRIS, card (Indonesia)
 */

import midtransClient from 'midtrans-client'
import { env } from '../config/env.js'
import { SUBSCRIPTION_PRICES } from '../constants/subscription.js'
import type { CreatePaymentInput, CreatePaymentResult } from '../types/payment.js'

let snapClient: InstanceType<typeof midtransClient.Snap> | null = null

function getSnap(): InstanceType<typeof midtransClient.Snap> {
  if (!snapClient) {
    if (!env.MIDTRANS_SERVER_KEY) {
      throw new Error('MIDTRANS_SERVER_KEY is not configured')
    }
    snapClient = new midtransClient.Snap({
      isProduction: env.MIDTRANS_IS_PRODUCTION,
      serverKey: env.MIDTRANS_SERVER_KEY,
      clientKey: env.MIDTRANS_CLIENT_KEY,
    })
  }
  return snapClient
}

export async function createMidtransSnapTransaction(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const snap = getSnap()

  if (input.targetTier === 'pro_trial') {
    throw new Error('Pro trial does not use Midtrans - use direct activation')
  }

  const amount =
    input.targetTier === 'pro'
      ? input.billingPeriod === 'yearly'
        ? SUBSCRIPTION_PRICES.pro.yearly
        : SUBSCRIPTION_PRICES.pro.monthly
      : input.billingPeriod === 'yearly'
        ? SUBSCRIPTION_PRICES.pro_plus.yearly
        : SUBSCRIPTION_PRICES.pro_plus.monthly

  // Midtrans amounts are in IDR for Indonesian payment methods
  const amountIdr = Math.round(amount * 16000) // Approximate USD to IDR

  // Midtrans order_id max 50 chars; use compact format for uniqueness
  const orderId = `wlw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

  // Finish URL is configured in Midtrans Dashboard (Settings > Snap Preference)
  // Recommended: https://your-app.com/transactions?midtransPayment=success
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amountIdr,
    },
    credit_card: {
      secure: true,
    },
    customer_details: {
      first_name: 'Customer',
      email: 'customer@walletwise.app',
    },
  }

  const transaction = await snap.createTransaction(parameter)

  const tx = transaction as { token?: string; redirect_url?: string }
  return {
    paymentId: tx.token ?? orderId,
    gatewayRef: orderId,
    status: 'pending',
    redirectUrl: tx.redirect_url,
    invoiceUrl: tx.redirect_url, // Use redirect_url for consistency with invoiceUrl flow
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  }
}
