/**
 * FX Rates Service
 * Fetches exchange rates from ExchangeRate-API (free, no key required)
 * and caches in database.
 * Uses raw SQL to work even when Prisma client is not regenerated.
 */

import { prisma } from '../config/database.js'
import { logger } from '../utils/logger.js'

const EXCHANGE_API_URL = 'https://open.er-api.com/v6/latest/USD'

interface ExchangeApiResponse {
  result: string
  base_code: string
  conversion_rates: Record<string, number>
  time_last_update_utc?: string
}

const DEFAULT_RATES: Record<string, number> = {
  USD: 1,
  IDR: 16862,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
}

export class FxRatesService {
  /**
   * Get current FX rates from cache
   */
  async getRates(): Promise<{ baseCode: string; rates: Record<string, number>; updatedAt: Date }> {
    try {
      const rows = await prisma.$queryRaw<
        Array<{ baseCode: string; rates: unknown; updatedAt: Date }>
      >`SELECT "baseCode", "rates", "updatedAt" FROM fx_rates WHERE id = 'default' LIMIT 1`

      if (rows?.[0]) {
        const r = rows[0]
        const rates = (typeof r.rates === 'object' && r.rates !== null ? r.rates : {}) as Record<
          string,
          number
        >
        return {
          baseCode: r.baseCode ?? 'USD',
          rates: Object.keys(rates).length > 0 ? rates : DEFAULT_RATES,
          updatedAt: r.updatedAt ?? new Date(),
        }
      }
    } catch {
      // Table may not exist
    }

    // Insert default and return
    try {
      await prisma.$executeRaw`
        INSERT INTO fx_rates (id, "baseCode", rates, "updatedAt")
        VALUES ('default', 'USD', ${JSON.stringify(DEFAULT_RATES)}::jsonb, NOW())
        ON CONFLICT (id) DO NOTHING
      `
    } catch {
      // Ignore
    }
    return {
      baseCode: 'USD',
      rates: DEFAULT_RATES,
      updatedAt: new Date(),
    }
  }

  /**
   * Fetch latest rates from ExchangeRate-API and update cache
   */
  async refreshRates(): Promise<{
    baseCode: string
    rates: Record<string, number>
    updatedAt: Date
  }> {
    logger.info('FX Rates: fetching from external API', { url: EXCHANGE_API_URL })

    const res = await fetch(EXCHANGE_API_URL)

    if (!res.ok) {
      logger.warn('FX Rates: API request failed, keeping cached rates', {
        status: res.status,
      })
      return this.getRates()
    }

    const data = (await res.json()) as ExchangeApiResponse

    if (data.result !== 'success' || !data.conversion_rates) {
      logger.warn('FX Rates: invalid API response, keeping cached rates')
      return this.getRates()
    }

    const rates = { ...DEFAULT_RATES, ...data.conversion_rates }
    const baseCode = data.base_code || 'USD'
    const ratesJson = JSON.stringify(rates)

    try {
      await prisma.$executeRaw`
        INSERT INTO fx_rates (id, "baseCode", rates, "updatedAt")
        VALUES ('default', ${baseCode}, ${ratesJson}::jsonb, NOW())
        ON CONFLICT (id) DO UPDATE SET
          "baseCode" = EXCLUDED."baseCode",
          rates = EXCLUDED.rates,
          "updatedAt" = EXCLUDED."updatedAt"
      `
    } catch (e) {
      logger.warn('FX Rates: failed to persist', { error: (e as Error).message })
    }

    logger.info('FX Rates: updated successfully', {
      currencies: Object.keys(rates).length,
    })

    return this.getRates()
  }
}

export const fxRatesService = new FxRatesService()
