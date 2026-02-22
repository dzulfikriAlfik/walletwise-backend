/**
 * Payment Gateway Interface
 * Abstraction for Stripe and Xendit implementations
 */

import type { CreatePaymentInput, CreatePaymentResult } from '../types/payment.js'

export interface IPaymentGateway {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>
}
