/**
 * API integration tests for common endpoints
 * Health check, 404 handling, error formats
 */

import '../setup'
import { resetAllMocks } from '../mocks/prisma.mock'

import supertest from 'supertest'
import app from '../../src/app'

const request = supertest(app)

describe('Common API Endpoints', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('GET /health', () => {
    it('should return 200 with status ok', async () => {
      const res = await request.get('/health').expect(200)

      expect(res.body.status).toBe('ok')
      expect(res.body.timestamp).toBeDefined()
    })
  })

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request.get('/api/v1/unknown-route').expect(404)

      expect(res.body.success).toBe(false)
      expect(res.body.error.code).toBe('NOT_FOUND')
    })

    it('should include path in error message', async () => {
      const res = await request.get('/api/v1/nonexistent').expect(404)

      expect(res.body.error.message).toContain('nonexistent')
    })
  })

  describe('Error Response Format', () => {
    it('should have consistent error format: { success, error: { code, message } }', async () => {
      const res = await request.get('/api/v1/some-nonexistent').expect(404)

      expect(res.body).toHaveProperty('success', false)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toHaveProperty('code')
      expect(res.body.error).toHaveProperty('message')
    })
  })

  describe('Authentication required endpoints', () => {
    const protectedEndpoints = [
      { method: 'get' as const, path: '/api/v1/wallets' },
      { method: 'get' as const, path: '/api/v1/transactions' },
      { method: 'get' as const, path: '/api/v1/auth/profile' },
      { method: 'get' as const, path: '/api/v1/wallets/summary' },
      { method: 'get' as const, path: '/api/v1/transactions/summary' },
    ]

    protectedEndpoints.forEach(({ method, path }) => {
      it(`should return 401 for ${method.toUpperCase()} ${path} without auth`, async () => {
        const res = await request[method](path).expect(401)

        expect(res.body.success).toBe(false)
        expect(res.body.error.code).toBe('AUTHENTICATION_ERROR')
      })
    })
  })
})
