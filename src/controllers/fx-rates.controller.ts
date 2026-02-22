/**
 * FX Rates Controller
 * Handles HTTP requests for FX rates endpoints
 */

import type { Request, Response, NextFunction } from 'express'
import { fxRatesService } from '../services/fx-rates.service.js'

export class FxRatesController {
  /**
   * Get current FX rates
   * GET /api/v1/settings/fx-rates
   */
  async getRates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rates = await fxRatesService.getRates()
      res.status(200).json({
        success: true,
        data: rates,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Refresh FX rates from external API
   * POST /api/v1/settings/fx-rates/refresh
   */
  async refreshRates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rates = await fxRatesService.refreshRates()
      res.status(200).json({
        success: true,
        data: rates,
        message: 'Exchange rates updated successfully',
      })
    } catch (error) {
      next(error)
    }
  }
}

export const fxRatesController = new FxRatesController()
