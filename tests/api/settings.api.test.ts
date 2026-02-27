/**
 * API integration tests for Settings endpoints (FX rates)
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import { generateTestAccessToken } from '../helpers'

import supertest from 'supertest'
import app from '../../src/app'

const request = supertest(app)

describe('Settings API Endpoints (FX Rates)', () => {
  const token = generateTestAccessToken()

  beforeEach(() => {
    resetAllMocks()
  })

  describe('GET /api/v1/settings/fx-rates', () => {
    it('should return 200 with FX rates', async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        {
          baseCode: 'USD',
          rates: { USD: 1, IDR: 16862, EUR: 0.92 },
          updatedAt: new Date(),
        },
      ])

      const res = await request.get('/api/v1/settings/fx-rates').expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.baseCode).toBe('USD')
      expect(res.body.data.rates).toBeDefined()
      expect(res.body.data.rates.USD).toBe(1)
    })

    it('should return default rates when no cache', async () => {
      prismaMock.$queryRaw.mockResolvedValue([])
      prismaMock.$executeRaw.mockResolvedValue(0)

      const res = await request.get('/api/v1/settings/fx-rates').expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.baseCode).toBe('USD')
      expect(res.body.data.rates).toBeDefined()
    })
  })

  describe('POST /api/v1/settings/fx-rates/refresh', () => {
    it('should return 401 without auth', async () => {
      await request.post('/api/v1/settings/fx-rates/refresh').expect(401)
    })

    it('should return 200 when refresh succeeds', async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        {
          baseCode: 'USD',
          rates: { USD: 1, IDR: 16862 },
          updatedAt: new Date(),
        },
      ])
      prismaMock.$executeRaw.mockResolvedValue(0)

      const res = await request
        .post('/api/v1/settings/fx-rates/refresh')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toBeDefined()
      expect(res.body.message).toBe('Exchange rates updated successfully')
    })
  })
})
