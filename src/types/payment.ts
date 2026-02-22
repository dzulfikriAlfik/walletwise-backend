/**
 * Payment gateway types and interfaces
 */

export type PaymentGateway = 'stripe' | 'xendit'
export type PaymentMethod = 'card' | 'invoice' | 'va' | 'ewallet' | 'qris'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired'

export interface CreatePaymentInput {
  userId: string
  targetTier: 'pro_trial' | 'pro' | 'pro_plus'
  billingPeriod: 'monthly' | 'yearly'
  gateway: PaymentGateway
  method: PaymentMethod
}

export interface CreatePaymentResult {
  paymentId: string
  gatewayRef: string
  status: PaymentStatus
  redirectUrl?: string
  invoiceUrl?: string
  expiresAt?: Date
}
