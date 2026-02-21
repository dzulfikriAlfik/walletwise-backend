/**
 * Authentication Routes (API v1)
 * Defines all auth-related endpoints
 */

import { Router } from 'express'
import { authController } from '../../controllers/auth.controller.js'
import { verifyToken } from '../../middleware/auth.middleware.js'

const router = Router()

/**
 * Public routes (no authentication required)
 */

// Register new user
// POST /api/v1/auth/register
router.post('/register', (req, res, next) => authController.register(req, res, next))

// Login user
// POST /api/v1/auth/login
router.post('/login', (req, res, next) => authController.login(req, res, next))

// Refresh access token
// POST /api/v1/auth/refresh
router.post('/refresh', (req, res, next) => authController.refreshToken(req, res, next))

/**
 * Protected routes (authentication required)
 */

// Get current user profile
// GET /api/v1/auth/profile
router.get('/profile', verifyToken, (req, res, next) =>
  authController.getProfile(req, res, next)
)

// Update user profile
// PATCH /api/v1/auth/profile
router.patch('/profile', verifyToken, (req, res, next) =>
  authController.updateProfile(req, res, next)
)

// Logout user
// POST /api/v1/auth/logout
router.post('/logout', verifyToken, (req, res, next) =>
  authController.logout(req, res, next)
)

export default router
