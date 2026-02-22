/**
 * Category Service
 * Business logic for custom category management
 */

import { prisma } from '../config/database.js'
import {
  SYSTEM_CATEGORIES,
  SYSTEM_CATEGORY_LABELS,
  isSystemCategory,
} from '../constants/categories.js'
import { NotFoundError, ConflictError, AuthorizationError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import type { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schemas.js'

export interface CategoryOption {
  id: string
  name: string
  type: string
  isSystem: boolean
}

/**
 * Get all category options for a user (system + custom)
 * Free / expired trial: system only
 * Pro / Pro Trial (active): system + custom
 */
export async function getCategoriesForUser(userId: string): Promise<CategoryOption[]> {
  logger.info('Category operation: getCategoriesForUser', { userId })

  const systemIncome = SYSTEM_CATEGORIES.income.map((key) => ({
    id: key,
    name: SYSTEM_CATEGORY_LABELS[key] ?? key,
    type: 'income' as const,
    isSystem: true,
  }))

  const systemExpense = SYSTEM_CATEGORIES.expense.map((key) => ({
    id: key,
    name: SYSTEM_CATEGORY_LABELS[key] ?? key,
    type: 'expense' as const,
    isSystem: true,
  }))

  const custom = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

  const customOptions: CategoryOption[] = custom.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    isSystem: false,
  }))

  return [...systemIncome, ...systemExpense, ...customOptions]
}

/**
 * Get custom categories only (for CRUD page)
 * Requires Pro or active Pro Trial - enforced by route middleware
 */
export async function getCustomCategories(userId: string) {
  logger.info('Category operation: getCustomCategories', { userId })

  return prisma.category.findMany({
    where: { userId },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })
}

/**
 * Create a custom category
 */
export async function createCategory(userId: string, data: CreateCategoryInput) {
  logger.info('Category operation: create', { userId, name: data.name, type: data.type })

  const existing = await prisma.category.findFirst({
    where: {
      userId,
      name: data.name.trim(),
      type: data.type,
    },
  })

  if (existing) {
    throw new ConflictError(`Category "${data.name}" already exists for this type`)
  }

  const name = data.name.trim()
  const systemKey = name.toLowerCase().replace(/\s+/g, '_')
  if (isSystemCategory(systemKey)) {
    throw new ConflictError('Cannot create a category with the same name as a system category')
  }

  return prisma.category.create({
    data: {
      userId,
      name,
      type: data.type,
    },
  })
}

/**
 * Update a custom category
 */
export async function updateCategory(
  userId: string,
  categoryId: string,
  data: UpdateCategoryInput
) {
  logger.info('Category operation: update', { userId, categoryId })

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  })

  if (!category) {
    throw new NotFoundError('Category')
  }

  if (category.userId !== userId) {
    throw new AuthorizationError('You do not have access to this category')
  }

  if (data.name !== undefined) {
    const name = data.name.trim()
    const existing = await prisma.category.findFirst({
      where: {
        userId,
        name,
        type: data.type ?? category.type,
        id: { not: categoryId },
      },
    })
    if (existing) {
      throw new ConflictError(`Category "${name}" already exists`)
    }
  }

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.type !== undefined && { type: data.type }),
    },
  })
}

/**
 * Delete a custom category
 */
export async function deleteCategory(userId: string, categoryId: string) {
  logger.info('Category operation: delete', { userId, categoryId })

  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  })

  if (!category) {
    throw new NotFoundError('Category')
  }

  if (category.userId !== userId) {
    throw new AuthorizationError('You do not have access to this category')
  }

  await prisma.category.delete({
    where: { id: categoryId },
  })

  return { deleted: true }
}
