/**
 * Webhook Routes
 * - Stripe: mounted at /webhook/stripe with express.raw for signature verification
 * - Xendit: mounted at /webhook/xendit with express.json
 */

import { Router } from 'express'
import { webhookController } from '../controllers/webhook.controller.js'

/** Stripe webhook router - requires raw body, mount with express.raw() */
export const stripeWebhookRouter = Router()
stripeWebhookRouter.post('/', (req, res) => webhookController.stripe(req, res))

/** Xendit webhook router - uses JSON body, mount after express.json() */
export const xenditWebhookRouter = Router()
xenditWebhookRouter.post('/', (req, res) => webhookController.xendit(req, res))

export default stripeWebhookRouter
