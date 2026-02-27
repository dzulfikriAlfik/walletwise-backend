/**
 * API integration tests for Billing endpoints
 */

import '../setup'
import { resetAllMocks } from '../mocks/prisma.mock'
import { generateTestAccessToken } from '../helpers'

import supertest from 'supertest'
import app from '../../src/app'

const request = supertest(app)

describe('Billing API Endpoints', () => {
  const token = generateTestAccessToken()

  beforeEach(() => {
    resetAllMocks()
  })

  describe('GET /api/v1/billing/plans', () => {
    it('should return 200 with subscription plans', async () => {
      const res = await request
        .get('/api/v1/billing/plans')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toBeDefined()
    })
  })
})
