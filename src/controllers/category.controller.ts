/**
 * Category Controller
 * Handles HTTP requests for category endpoints
 */

import type { Request, Response, NextFunction } from 'express'
import * as categoryService from '../services/category.service.js'
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schemas.js'
import { ValidationError } from '../utils/errors.js'
import { formatZodErrors } from '../utils/validation.js'

/**
 * Get all category options (system + custom) for transaction forms
 * GET /api/v1/categories
 */
export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID not found in request')
    }

    const categories = await categoryService.getCategoriesForUser(userId)

    res.status(200).json({
      success: true,
      data: categories,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get custom categories only (for CRUD page) - Pro/Pro Trial only
 * GET /api/v1/categories/custom
 */
export async function getCustom(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID not found in request')
    }

    const categories = await categoryService.getCustomCategories(userId)

    res.status(200).json({
      success: true,
      data: categories,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Create a custom category - Pro/Pro Trial only
 * POST /api/v1/categories
 */
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID not found in request')
    }

    const validationResult = createCategorySchema.safeParse(req.body)

    if (!validationResult.success) {
      const errors = formatZodErrors(validationResult.error)
      throw new ValidationError('Validation failed', errors)
    }

    const category = await categoryService.createCategory(userId, validationResult.data)

    res.status(201).json({
      success: true,
      data: category,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Update a custom category - Pro/Pro Trial only
 * PATCH /api/v1/categories/:id
 */
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId
    const categoryId = req.params.id

    if (!userId) {
      throw new ValidationError('User ID not found in request')
    }

    const validationResult = updateCategorySchema.safeParse(req.body)

    if (!validationResult.success) {
      const errors = formatZodErrors(validationResult.error)
      throw new ValidationError('Validation failed', errors)
    }

    const category = await categoryService.updateCategory(
      userId,
      categoryId,
      validationResult.data
    )

    res.status(200).json({
      success: true,
      data: category,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Delete a custom category - Pro/Pro Trial only
 * DELETE /api/v1/categories/:id
 */
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.userId
    const categoryId = req.params.id

    if (!userId) {
      throw new ValidationError('User ID not found in request')
    }

    await categoryService.deleteCategory(userId, categoryId)

    res.status(200).json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    next(error)
  }
}
