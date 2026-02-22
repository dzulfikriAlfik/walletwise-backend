/**
 * Settings Routes (API v1)
 * Settings-related endpoints (FX rates, etc.)
 */

import { Router } from 'express'
import { fxRatesController } from '../../controllers/fx-rates.controller.js'
import { verifyToken } from '../../middleware/auth.middleware.js'

const router = Router()

// FX rates - public read (for login page currency display), protected refresh
// GET /api/v1/settings/fx-rates
router.get('/fx-rates', (req, res, next) =>
  fxRatesController.getRates(req, res, next)
)

// POST /api/v1/settings/fx-rates/refresh - requires auth
router.post('/fx-rates/refresh', verifyToken, (req, res, next) =>
  fxRatesController.refreshRates(req, res, next)
)

export default router
