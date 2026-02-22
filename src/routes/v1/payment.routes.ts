/**
 * Payment Routes (API v1)
 */

import { Router } from 'express'
import { paymentController } from '../../controllers/payment.controller.js'
import { verifyToken } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(verifyToken)
router.post('/create', (req, res, next) => paymentController.create(req, res, next))

export default router
