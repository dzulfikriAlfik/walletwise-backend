/**
 * Unit tests for subscription middleware (requireProPlus, requireProOrActiveTrial)
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import { createMockSubscription } from '../helpers'

import type { Request, Response, NextFunction } from 'express'
import {
  requireProPlus,
  requireProOrActiveTrial,
} from '../../src/middleware/subscription.middleware'

function createMocks(overrides: Partial<Request> = {}) {
  const req = {
    user: { userId: 'test-user-id', email: 'test@example.com' },
    ...overrides,
  } as unknown as Request
  const res = {} as Response
  const next = jest.fn() as jest.MockedFunction<NextFunction>
  return { req, res, next }
}

describe('Subscription Middleware', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('requireProPlus', () => {
    it('should call next() when user has pro_plus tier', async () => {
      const { req, res, next } = createMocks()
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'pro_plus' })
      )

      await requireProPlus(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should call next with AuthorizationError when user has free tier', async () => {
      const { req, res, next } = createMocks()
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'free' })
      )

      await requireProPlus(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Pro+'),
          statusCode: 403,
        })
      )
    })

    it('should call next with AuthorizationError when no userId', async () => {
      const { req, res, next } = createMocks({ user: undefined })

      await requireProPlus(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: 403,
        })
      )
    })
  })

  describe('requireProOrActiveTrial', () => {
    it('should call next() when user has pro tier', async () => {
      const { req, res, next } = createMocks()
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'pro' })
      )

      await requireProOrActiveTrial(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should call next() when user has active pro_trial', async () => {
      const { req, res, next } = createMocks()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'pro_trial', endDate: futureDate })
      )

      await requireProOrActiveTrial(req, res, next)

      expect(next).toHaveBeenCalledWith()
    })

    it('should call next with AuthorizationError when pro_trial expired', async () => {
      const { req, res, next } = createMocks()
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'pro_trial', endDate: pastDate })
      )

      await requireProOrActiveTrial(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Pro'),
          statusCode: 403,
        })
      )
    })

    it('should call next with AuthorizationError when free tier', async () => {
      const { req, res, next } = createMocks()
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'free' })
      )

      await requireProOrActiveTrial(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Pro'),
          statusCode: 403,
        })
      )
    })
  })
})
