/**
 * Xendit Payment Gateway
 * Handles Invoice, VA, E-wallet, QRIS payments
 */

import { Xendit } from 'xendit-node'
import { env } from '../config/env.js'
import { SUBSCRIPTION_PRICES } from '../constants/subscription.js'
import type { CreatePaymentInput, CreatePaymentResult } from '../types/payment.js'

let xenditClient: Xendit | null = null

function getXendit(): Xendit {
  if (!xenditClient) {
    if (!env.XENDIT_SECRET_KEY) {
      throw new Error('XENDIT_SECRET_KEY is not configured')
    }
    xenditClient = new Xendit({ secretKey: env.XENDIT_SECRET_KEY })
  }
  return xenditClient
}

export async function createXenditInvoice(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const xendit = getXendit()
  const { Invoice } = xendit

  if (input.targetTier === 'pro_trial') {
    throw new Error('Pro trial does not use Xendit - use direct activation')
  }

  const amount =
    input.targetTier === 'pro'
      ? input.billingPeriod === 'yearly'
        ? SUBSCRIPTION_PRICES.pro.yearly
        : SUBSCRIPTION_PRICES.pro.monthly
      : input.billingPeriod === 'yearly'
        ? SUBSCRIPTION_PRICES.pro_plus.yearly
        : SUBSCRIPTION_PRICES.pro_plus.monthly

  // Xendit amounts are in IDR for ID payment methods; for USD we use amount * 100 (cents) or convert
  // Invoice API typically uses IDR - we'll use USD amount as-is and let Xendit handle (or use IDR)
  const amountIdr = Math.round(amount * 16000) // Approximate USD to IDR

  const gatewayRef = `wlw_${input.userId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  const baseUrl = env.FRONTEND_URL.replace(/\/$/, '')
  const tierParam = encodeURIComponent(input.targetTier)
  const successRedirectUrl = baseUrl ? `${baseUrl}/transactions?xenditPayment=success&tier=${tierParam}` : undefined

  const invoice = await Invoice.createInvoice({
    data: {
      externalId: gatewayRef,
      amount: amountIdr,
      currency: 'IDR',
      description: `WalletWise ${input.targetTier} - ${input.billingPeriod}`,
      invoiceDuration: 86400 * 2, // 2 days
      reminderTime: 1,
      successRedirectUrl,
    },
  })

  const inv = invoice as unknown as {
    id?: string
    externalId?: string
    invoiceUrl?: string
    expiryDate?: string | Date
  }
  return {
    paymentId: inv.id ?? gatewayRef,
    gatewayRef: inv.externalId ?? gatewayRef,
    status: 'pending',
    invoiceUrl: inv.invoiceUrl ?? undefined,
    expiresAt: inv.expiryDate ? new Date(inv.expiryDate) : undefined,
  }
}
