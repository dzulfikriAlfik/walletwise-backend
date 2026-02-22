/**
 * Webhook Routes
 * Mounted at /webhook/stripe with express.raw for signature verification
 */

import { Router } from 'express'
import { webhookController } from '../controllers/webhook.controller.js'

const router = Router()

// POST /webhook/stripe - raw body required for Stripe signature verification
router.post('/', (req, res) => webhookController.stripe(req, res))

export default router
