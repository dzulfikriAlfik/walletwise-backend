/**
 * Unit tests for auth middleware (verifyToken, optionalAuth)
 */

import '../setup'
import { resetAllMocks } from '../mocks/prisma.mock'
import { generateTestAccessToken } from '../helpers'

import type { Request, Response, NextFunction } from 'express'
import { verifyToken, optionalAuth } from '../../src/middleware/auth.middleware'

// Helper to create mock req/res/next
function createMocks(overrides: Partial<Request> = {}) {
  const req = {
    cookies: {},
    ...overrides,
  } as unknown as Request

  const res = {} as Response

  const next = jest.fn() as jest.MockedFunction<NextFunction>

  return { req, res, next }
}

describe('Auth Middleware', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('verifyToken', () => {
    it('should call next() and attach user when token is valid', () => {
      const token = generateTestAccessToken()
      const { req, res, next } = createMocks({
        cookies: { accessToken: token },
      } as any)

      verifyToken(req, res, next)

      expect(next).toHaveBeenCalledWith()
      expect(req.user).toBeDefined()
      expect(req.user?.userId).toBe('test-user-id')
      expect(req.user?.email).toBe('test@example.com')
    })

    it('should call next with AuthenticationError when no token', () => {
      const { req, res, next } = createMocks()

      verifyToken(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token missing',
          statusCode: 401,
        })
      )
    })

    it('should call next with AuthenticationError when token is invalid', () => {
      const { req, res, next } = createMocks({
        cookies: { accessToken: 'invalid-token-value' },
      } as any)

      verifyToken(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
        })
      )
    })

    it('should reject tokens signed with wrong secret', () => {
      // Sign with refresh secret instead of access secret
      const jwt = require('jsonwebtoken')
      const wrongToken = jwt.sign(
        { userId: 'test', email: 'test@test.com' },
        process.env.JWT_REFRESH_SECRET!, // wrong secret
        { expiresIn: '15m' }
      )
      const { req, res, next } = createMocks({
        cookies: { accessToken: wrongToken },
      } as any)

      verifyToken(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401 })
      )
    })
  })

  describe('optionalAuth', () => {
    it('should call next() with user when token is valid', () => {
      const token = generateTestAccessToken()
      const { req, res, next } = createMocks({
        cookies: { accessToken: token },
      } as any)

      optionalAuth(req, res, next)

      expect(next).toHaveBeenCalledWith()
      expect(req.user?.userId).toBe('test-user-id')
    })

    it('should call next() without user when no token', () => {
      const { req, res, next } = createMocks()

      optionalAuth(req, res, next)

      expect(next).toHaveBeenCalledWith()
      expect(req.user).toBeUndefined()
    })

    it('should call next() without user when token is invalid', () => {
      const { req, res, next } = createMocks({
        cookies: { accessToken: 'bad-token' },
      } as any)

      optionalAuth(req, res, next)

      expect(next).toHaveBeenCalledWith()
      expect(req.user).toBeUndefined()
    })
  })
})
