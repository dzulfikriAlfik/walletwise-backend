/**
 * Schema validation tests
 * Tests Zod schemas used for request validation
 */

import '../setup'

import { registerSchema, loginSchema } from '../../src/schemas/auth.schemas'
import { createWalletSchema, updateWalletSchema } from '../../src/schemas/wallet.schemas'
import { createTransactionSchema, updateTransactionSchema } from '../../src/schemas/transaction.schemas'
import { createCategorySchema, updateCategorySchema } from '../../src/schemas/category.schemas'
import { upgradeSubscriptionSchema } from '../../src/schemas/billing.schemas'
import { createPaymentSchema } from '../../src/schemas/payment.schemas'

describe('Auth Schemas', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        name: 'Test User',
        password: 'Test@1234',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        name: 'Test User',
        password: 'Test@1234',
      })
      expect(result.success).toBe(false)
    })

    it('should reject short name', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        name: 'A',
        password: 'Test@1234',
      })
      expect(result.success).toBe(false)
    })

    it('should reject weak password (no uppercase)', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        name: 'Test User',
        password: 'test@1234',
      })
      expect(result.success).toBe(false)
    })

    it('should reject weak password (no special char)', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        name: 'Test User',
        password: 'Test12345',
      })
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const result = registerSchema.safeParse({
        email: 'user@example.com',
        name: 'Test User',
        password: 'Te@1',
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing fields', () => {
      const result = registerSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('loginSchema', () => {
    it('should accept valid login data', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: 'anypassword',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid',
        password: 'pass',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'user@example.com',
        password: '',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Wallet Schemas', () => {
  describe('createWalletSchema', () => {
    it('should accept valid wallet data', () => {
      const result = createWalletSchema.safeParse({
        name: 'Main Wallet',
        balance: 100,
        currency: 'USD',
      })
      expect(result.success).toBe(true)
    })

    it('should reject short name', () => {
      const result = createWalletSchema.safeParse({
        name: 'AB',
        balance: 0,
        currency: 'USD',
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative balance', () => {
      const result = createWalletSchema.safeParse({
        name: 'Main Wallet',
        balance: -100,
        currency: 'USD',
      })
      expect(result.success).toBe(false)
    })

    it('should accept optional color and icon', () => {
      const result = createWalletSchema.safeParse({
        name: 'Main Wallet',
        balance: 0,
        currency: 'USD',
        color: '#3B82F6',
        icon: 'wallet',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('updateWalletSchema', () => {
    it('should accept partial updates', () => {
      const result = updateWalletSchema.safeParse({
        name: 'Updated Wallet',
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty object (no updates)', () => {
      const result = updateWalletSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })
})

describe('Transaction Schemas', () => {
  describe('createTransactionSchema', () => {
    it('should accept valid transaction data', () => {
      const result = createTransactionSchema.safeParse({
        walletId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'expense',
        category: 'food',
        amount: 25.5,
        description: 'Lunch',
        date: '2025-01-15T12:00:00.000Z',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid type', () => {
      const result = createTransactionSchema.safeParse({
        walletId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'transfer',
        category: 'food',
        amount: 25,
        description: 'Test',
        date: '2025-01-15T12:00:00.000Z',
      })
      expect(result.success).toBe(false)
    })

    it('should reject zero amount', () => {
      const result = createTransactionSchema.safeParse({
        walletId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'expense',
        category: 'food',
        amount: 0,
        description: 'Test',
        date: '2025-01-15T12:00:00.000Z',
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative amount', () => {
      const result = createTransactionSchema.safeParse({
        walletId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'expense',
        category: 'food',
        amount: -10,
        description: 'Test',
        date: '2025-01-15T12:00:00.000Z',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid date format', () => {
      const result = createTransactionSchema.safeParse({
        walletId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'expense',
        category: 'food',
        amount: 10,
        description: 'Test',
        date: 'not-a-date',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateTransactionSchema', () => {
    it('should accept partial update', () => {
      const result = updateTransactionSchema.safeParse({
        amount: 30,
      })
      expect(result.success).toBe(true)
    })

    it('should accept empty object', () => {
      const result = updateTransactionSchema.safeParse({})
      expect(result.success).toBe(true)
    })
  })
})

describe('Category Schemas', () => {
  describe('createCategorySchema', () => {
    it('should accept valid category data', () => {
      const result = createCategorySchema.safeParse({
        name: 'Groceries',
        type: 'expense',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = createCategorySchema.safeParse({
        name: '',
        type: 'expense',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid type', () => {
      const result = createCategorySchema.safeParse({
        name: 'Groceries',
        type: 'transfer',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateCategorySchema', () => {
    it('should accept partial update', () => {
      const result = updateCategorySchema.safeParse({
        name: 'Updated Name',
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('Billing Schemas', () => {
  describe('upgradeSubscriptionSchema', () => {
    it('should accept valid upgrade data', () => {
      const result = upgradeSubscriptionSchema.safeParse({
        targetTier: 'pro',
        billingPeriod: 'monthly',
      })
      expect(result.success).toBe(true)
    })

    it('should default billingPeriod to monthly', () => {
      const result = upgradeSubscriptionSchema.safeParse({
        targetTier: 'pro',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.billingPeriod).toBe('monthly')
      }
    })

    it('should reject invalid tier', () => {
      const result = upgradeSubscriptionSchema.safeParse({
        targetTier: 'enterprise',
        billingPeriod: 'monthly',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Payment Schemas', () => {
  describe('createPaymentSchema', () => {
    it('should accept valid payment data', () => {
      const result = createPaymentSchema.safeParse({
        targetTier: 'pro',
        billingPeriod: 'monthly',
        gateway: 'stripe',
        method: 'card',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid gateway', () => {
      const result = createPaymentSchema.safeParse({
        targetTier: 'pro',
        billingPeriod: 'monthly',
        gateway: 'paypal',
        method: 'card',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid method', () => {
      const result = createPaymentSchema.safeParse({
        targetTier: 'pro',
        billingPeriod: 'monthly',
        gateway: 'stripe',
        method: 'bitcoin',
      })
      expect(result.success).toBe(false)
    })
  })
})
