/**
 * Category Routes (API v1)
 * Defines all category-related endpoints
 */

import { Router } from 'express'
import * as categoryController from '../../controllers/category.controller.js'
import { verifyToken } from '../../middleware/auth.middleware.js'
import { requireProOrActiveTrial } from '../../middleware/subscription.middleware.js'

const router = Router()

// All category routes require authentication
router.use(verifyToken)

// Get all category options (system + custom) - for transaction forms
// GET /api/v1/categories
router.get('/', (req, res, next) => categoryController.getAll(req, res, next))

// Pro/Pro Trial only: CRUD custom categories
router.use(requireProOrActiveTrial)

// Get custom categories only
// GET /api/v1/categories/custom
router.get('/custom', (req, res, next) => categoryController.getCustom(req, res, next))

// Create custom category
// POST /api/v1/categories
router.post('/', (req, res, next) => categoryController.create(req, res, next))

// Update custom category
// PATCH /api/v1/categories/:id
router.patch('/:id', (req, res, next) => categoryController.update(req, res, next))

// Delete custom category
// DELETE /api/v1/categories/:id
router.delete('/:id', (req, res, next) => categoryController.remove(req, res, next))

export default router
