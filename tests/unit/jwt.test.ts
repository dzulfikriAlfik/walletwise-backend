/**
 * JWT utility tests
 */

import '../setup'

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/utils/jwt'

describe('JWT Utilities', () => {
  const payload = { userId: 'user-123', email: 'test@example.com' }

  describe('generateAccessToken', () => {
    it('should generate a valid JWT string', () => {
      const token = generateAccessToken(payload)

      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })
  })

  describe('generateRefreshToken', () => {
    it('should generate a valid JWT string', () => {
      const token = generateRefreshToken(payload)

      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should generate different tokens from access token', () => {
      const accessToken = generateAccessToken(payload)
      const refreshToken = generateRefreshToken(payload)

      expect(accessToken).not.toBe(refreshToken)
    })
  })

  describe('verifyAccessToken', () => {
    it('should verify and decode a valid access token', () => {
      const token = generateAccessToken(payload)
      const decoded = verifyAccessToken(token)

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.email).toBe(payload.email)
    })

    it('should throw for an invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow(
        'Invalid or expired access token'
      )
    })

    it('should throw for a refresh token used as access token', () => {
      const refreshToken = generateRefreshToken(payload)

      expect(() => verifyAccessToken(refreshToken)).toThrow(
        'Invalid or expired access token'
      )
    })
  })

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const token = generateRefreshToken(payload)
      const decoded = verifyRefreshToken(token)

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.email).toBe(payload.email)
    })

    it('should throw for an invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow(
        'Invalid or expired refresh token'
      )
    })

    it('should throw for an access token used as refresh token', () => {
      const accessToken = generateAccessToken(payload)

      expect(() => verifyRefreshToken(accessToken)).toThrow(
        'Invalid or expired refresh token'
      )
    })
  })
})
