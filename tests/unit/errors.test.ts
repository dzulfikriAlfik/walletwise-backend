/**
 * Error classes and error handling tests
 */

import '../setup'

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  TrialExpiredError,
} from '../../src/utils/errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with status code and message', () => {
      const error = new AppError(500, 'Something went wrong')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
      expect(error.statusCode).toBe(500)
      expect(error.message).toBe('Something went wrong')
      expect(error.code).toBe('INTERNAL_ERROR')
    })

    it('should accept custom error code', () => {
      const error = new AppError(422, 'Unprocessable', 'CUSTOM_CODE')

      expect(error.code).toBe('CUSTOM_CODE')
    })
  })

  describe('ValidationError', () => {
    it('should have status 400', () => {
      const error = new ValidationError('Invalid input')

      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
    })

    it('should accept optional details', () => {
      const details = { email: ['Invalid email address'] }
      const error = new ValidationError('Validation failed', details)

      expect(error.details).toEqual(details)
    })
  })

  describe('AuthenticationError', () => {
    it('should have status 401', () => {
      const error = new AuthenticationError()

      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('AUTHENTICATION_ERROR')
      expect(error.message).toBe('Authentication failed')
    })

    it('should accept custom message', () => {
      const error = new AuthenticationError('Invalid token')

      expect(error.message).toBe('Invalid token')
    })
  })

  describe('AuthorizationError', () => {
    it('should have status 403', () => {
      const error = new AuthorizationError()

      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('AUTHORIZATION_ERROR')
    })
  })

  describe('TrialExpiredError', () => {
    it('should have status 403 and PRO_TRIAL_EXPIRED code', () => {
      const error = new TrialExpiredError()

      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('PRO_TRIAL_EXPIRED')
    })
  })

  describe('NotFoundError', () => {
    it('should have status 404 and include resource name', () => {
      const error = new NotFoundError('Wallet')

      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.message).toBe('Wallet not found')
    })
  })

  describe('ConflictError', () => {
    it('should have status 409', () => {
      const error = new ConflictError('Resource already exists')

      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT')
      expect(error.message).toBe('Resource already exists')
    })
  })
})
