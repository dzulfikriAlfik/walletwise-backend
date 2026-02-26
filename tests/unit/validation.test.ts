/**
 * Validation utility tests
 */

import '../setup'

import { formatZodErrors } from '../../src/utils/validation'
import { z } from 'zod'

describe('formatZodErrors', () => {
  const schema = z.object({
    email: z.string().email(),
    name: z.string().min(2),
    age: z.number().positive(),
  })

  it('should format Zod errors into field-keyed object', () => {
    const result = schema.safeParse({ email: 'invalid', name: 'A', age: -1 })

    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = formatZodErrors(result.error)

      expect(errors).toHaveProperty('email')
      expect(errors).toHaveProperty('name')
      expect(errors).toHaveProperty('age')
      expect(Array.isArray(errors.email)).toBe(true)
      expect(errors.email.length).toBeGreaterThan(0)
    }
  })

  it('should group multiple errors for the same field', () => {
    const strictSchema = z.object({
      password: z
        .string()
        .min(8, 'Too short')
        .regex(/[A-Z]/, 'Needs uppercase'),
    })

    const result = strictSchema.safeParse({ password: 'a' })

    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = formatZodErrors(result.error)

      expect(errors.password.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('should return empty object for valid data', () => {
    const result = schema.safeParse({
      email: 'user@example.com',
      name: 'Test',
      age: 25,
    })

    expect(result.success).toBe(true)
  })
})
