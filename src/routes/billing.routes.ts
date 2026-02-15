/**
 * Billing Routes
 */

import { Router } from 'express'
import { billingController } from '@/controllers/billing.controller'
import { verifyToken } from '@/middleware/auth.middleware'

const router = Router()

// Public - get plans
router.get('/plans', (req, res, next) => billingController.getPlans(req, res, next))

// Protected - upgrade & payment
router.use(verifyToken)
router.post('/upgrade', (req, res, next) => billingController.upgrade(req, res, next))
router.post('/dummy-payment', (req, res, next) => billingController.dummyPayment(req, res, next))

export default router
