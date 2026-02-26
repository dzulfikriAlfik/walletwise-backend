/**
 * Unit tests for error middleware
 */

import '../setup'
import '../mocks/prisma.mock'

import type { Request, Response, NextFunction } from 'express'
import { errorHandler } from '../../src/middleware/error.middleware'
import {
  ValidationError,
  AuthenticationError,
  NotFoundError,
} from '../../src/utils/errors'

function createMocks() {
  const req = { method: 'GET', path: '/test' } as Request
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response
  const next = jest.fn() as jest.MockedFunction<NextFunction>
  return { req, res, next }
}

describe('Error Handler Middleware', () => {
  it('should handle AppError with correct status and code', () => {
    const { req, res, next } = createMocks()
    const error = new NotFoundError('Item')

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Item not found',
      },
    })
  })

  it('should handle ValidationError with details', () => {
    const { req, res, next } = createMocks()
    const error = new ValidationError('Validation failed', {
      email: ['Invalid email'],
    })

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { email: ['Invalid email'] },
      },
    })
  })

  it('should handle AuthenticationError', () => {
    const { req, res, next } = createMocks()
    const error = new AuthenticationError('Invalid token')

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Invalid token',
      },
    })
  })

  it('should handle unknown errors as 500', () => {
    const { req, res, next } = createMocks()
    const error = new Error('Something broke')

    errorHandler(error, req, res, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    })
  })
})
