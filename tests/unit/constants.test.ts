/**
 * Constants tests
 */

import '../setup'

import {
  SUBSCRIPTION_TIERS,
  WALLET_LIMITS,
  PRO_TRIAL_DAYS,
  SUBSCRIPTION_PRICES,
} from '../../src/constants/subscription'

import {
  SYSTEM_CATEGORIES,
  SYSTEM_CATEGORY_LABELS,
  isSystemCategory,
} from '../../src/constants/categories'

describe('Subscription Constants', () => {
  it('should have 4 subscription tiers', () => {
    expect(SUBSCRIPTION_TIERS).toHaveLength(4)
    expect(SUBSCRIPTION_TIERS).toContain('free')
    expect(SUBSCRIPTION_TIERS).toContain('pro_trial')
    expect(SUBSCRIPTION_TIERS).toContain('pro')
    expect(SUBSCRIPTION_TIERS).toContain('pro_plus')
  })

  it('should set free tier wallet limit to 3', () => {
    expect(WALLET_LIMITS.free).toBe(3)
  })

  it('should set unlimited (null) wallets for paid tiers', () => {
    expect(WALLET_LIMITS.pro).toBeNull()
    expect(WALLET_LIMITS.pro_plus).toBeNull()
    expect(WALLET_LIMITS.pro_trial).toBeNull()
  })

  it('should set Pro trial to 7 days', () => {
    expect(PRO_TRIAL_DAYS).toBe(7)
  })

  it('should have correct pricing', () => {
    expect(SUBSCRIPTION_PRICES.pro.monthly).toBe(9.99)
    expect(SUBSCRIPTION_PRICES.pro.yearly).toBe(99.99)
    expect(SUBSCRIPTION_PRICES.pro_plus.monthly).toBe(19.99)
    expect(SUBSCRIPTION_PRICES.pro_plus.yearly).toBe(199.99)
  })
})

describe('Category Constants', () => {
  it('should have income categories', () => {
    expect(SYSTEM_CATEGORIES.income.length).toBeGreaterThan(0)
    expect(SYSTEM_CATEGORIES.income).toContain('salary')
    expect(SYSTEM_CATEGORIES.income).toContain('freelance')
  })

  it('should have expense categories', () => {
    expect(SYSTEM_CATEGORIES.expense.length).toBeGreaterThan(0)
    expect(SYSTEM_CATEGORIES.expense).toContain('food')
    expect(SYSTEM_CATEGORIES.expense).toContain('transport')
  })

  it('should have labels for all system categories', () => {
    const allCategories = [
      ...SYSTEM_CATEGORIES.income,
      ...SYSTEM_CATEGORIES.expense,
    ]
    allCategories.forEach((cat) => {
      expect(SYSTEM_CATEGORY_LABELS[cat]).toBeDefined()
      expect(typeof SYSTEM_CATEGORY_LABELS[cat]).toBe('string')
    })
  })

  describe('isSystemCategory', () => {
    it('should return true for system income categories', () => {
      expect(isSystemCategory('salary')).toBe(true)
      expect(isSystemCategory('freelance')).toBe(true)
    })

    it('should return true for system expense categories', () => {
      expect(isSystemCategory('food')).toBe(true)
      expect(isSystemCategory('transport')).toBe(true)
    })

    it('should return false for custom categories', () => {
      expect(isSystemCategory('groceries')).toBe(false)
      expect(isSystemCategory('pets')).toBe(false)
      expect(isSystemCategory('myCustom')).toBe(false)
    })
  })
})
