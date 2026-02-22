/**
 * Billing Routes (API v1)
 * Plans only - payment via /payments/create
 */

import { Router } from 'express'
import { billingController } from '../../controllers/billing.controller.js'

const router = Router()

// Public - get plans
router.get('/plans', (req, res, next) => billingController.getPlans(req, res, next))

export default router
