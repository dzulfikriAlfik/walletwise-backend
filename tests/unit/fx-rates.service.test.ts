/**
 * Unit tests for FX Rates Service
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'

import { fxRatesService } from '../../src/services/fx-rates.service'

describe('FxRatesService', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    resetAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('getRates', () => {
    it('should return cached rates from database', async () => {
      const cachedRates = {
        baseCode: 'USD',
        rates: { USD: 1, IDR: 16862, EUR: 0.92 },
        updatedAt: new Date(),
      }
      prismaMock.$queryRaw.mockResolvedValue([cachedRates])

      const result = await fxRatesService.getRates()

      expect(result.baseCode).toBe('USD')
      expect(result.rates.USD).toBe(1)
      expect(result.rates.IDR).toBe(16862)
    })

    it('should return default rates when cache empty', async () => {
      prismaMock.$queryRaw.mockResolvedValue([])
      prismaMock.$executeRaw.mockResolvedValue(0)

      const result = await fxRatesService.getRates()

      expect(result.baseCode).toBe('USD')
      expect(result.rates.USD).toBe(1)
      expect(result.rates.IDR).toBeDefined()
    })

    it('should return default rates when query throws', async () => {
      prismaMock.$queryRaw.mockRejectedValue(new Error('Table not found'))
      prismaMock.$executeRaw.mockResolvedValue(0)

      const result = await fxRatesService.getRates()

      expect(result.baseCode).toBe('USD')
      expect(result.rates).toBeDefined()
    })
  })

  describe('refreshRates', () => {
    it('should fetch from API and update cache', async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        {
          baseCode: 'USD',
          rates: { USD: 1, IDR: 17000, EUR: 0.93 },
          updatedAt: new Date(),
        },
      ])
      prismaMock.$executeRaw.mockResolvedValue(0)
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            result: 'success',
            base_code: 'USD',
            conversion_rates: { USD: 1, IDR: 17000, EUR: 0.93 },
          }),
      })

      const result = await fxRatesService.refreshRates()

      expect(result.baseCode).toBe('USD')
      expect(result.rates).toBeDefined()
    })

    it('should return cached rates when API fails', async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        {
          baseCode: 'USD',
          rates: { USD: 1, IDR: 16862 },
          updatedAt: new Date(),
        },
      ])
      global.fetch = jest.fn().mockResolvedValue({ ok: false })

      const result = await fxRatesService.refreshRates()

      expect(result.baseCode).toBe('USD')
      expect(result.rates).toBeDefined()
    })

    it('should return cached rates when API returns invalid response', async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        {
          baseCode: 'USD',
          rates: { USD: 1 },
          updatedAt: new Date(),
        },
      ])
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: 'error' }),
      })

      const result = await fxRatesService.refreshRates()

      expect(result.baseCode).toBe('USD')
    })
  })
})
