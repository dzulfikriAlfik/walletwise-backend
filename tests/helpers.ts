/**
 * Test helpers and factory functions
 */

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key-for-testing'

/**
 * Create a mock user object
 */
export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: '$2a$10$hashedpassword',
    avatarUrl: null,
    preferredLanguage: 'en',
    preferredCurrency: 'USD',
    transactionTimeRange: 'weekly',
    firstDayOfWeek: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

/**
 * Create a mock subscription
 */
export function createMockSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-sub-id',
    userId: 'test-user-id',
    tier: 'free',
    isActive: true,
    startDate: new Date('2025-01-01'),
    endDate: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

/**
 * Create a mock wallet
 */
export function createMockWallet(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-wallet-id',
    userId: 'test-user-id',
    name: 'Main Wallet',
    balance: 1000,
    currency: 'USD',
    color: '#3B82F6',
    icon: 'wallet',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

/**
 * Create a mock transaction
 */
export function createMockTransaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-transaction-id',
    walletId: 'test-wallet-id',
    userId: 'test-user-id',
    type: 'expense',
    category: 'food',
    amount: 50,
    description: 'Lunch',
    date: new Date('2025-01-15'),
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    wallet: {
      id: 'test-wallet-id',
      name: 'Main Wallet',
      currency: 'USD',
    },
    ...overrides,
  }
}

/**
 * Create a mock category
 */
export function createMockCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-category-id',
    userId: 'test-user-id',
    name: 'Custom Food',
    type: 'expense',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

/**
 * Create a mock payment
 */
export function createMockPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-payment-id',
    userId: 'test-user-id',
    gateway: 'stripe',
    gatewayRef: 'cs_test_123',
    method: 'card',
    status: 'pending',
    amount: 9.99,
    currency: 'USD',
    targetTier: 'pro',
    billingPeriod: 'monthly',
    invoiceUrl: null,
    expiresAt: null,
    rawRequest: null,
    rawResponse: null,
    rawWebhook: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  }
}

/**
 * Generate a valid JWT access token for testing
 */
export function generateTestAccessToken(
  payload: { userId: string; email: string } = {
    userId: 'test-user-id',
    email: 'test@example.com',
  }
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' })
}

/**
 * Generate a valid JWT refresh token for testing
 */
export function generateTestRefreshToken(
  payload: { userId: string; email: string } = {
    userId: 'test-user-id',
    email: 'test@example.com',
  }
): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' })
}
