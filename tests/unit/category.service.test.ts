/**
 * Unit tests for Category Service
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import { createMockCategory } from '../helpers'

import {
  getCategoriesForUser,
  getCustomCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../src/services/category.service'

describe('CategoryService', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('getCategoriesForUser', () => {
    it('should return system categories plus custom categories', async () => {
      const customCategories = [
        createMockCategory({ id: 'cat-1', name: 'Groceries', type: 'expense' }),
      ]
      prismaMock.category.findMany.mockResolvedValue(customCategories)

      const result = await getCategoriesForUser('test-user-id')

      // System: 4 income + 8 expense = 12 system + 1 custom = 13
      expect(result.length).toBeGreaterThanOrEqual(12)
      const systemCategories = result.filter((c) => c.isSystem)
      const customOnes = result.filter((c) => !c.isSystem)
      expect(systemCategories.length).toBe(12)
      expect(customOnes.length).toBe(1)
      expect(customOnes[0].name).toBe('Groceries')
    })
  })

  describe('getCustomCategories', () => {
    it('should return only custom categories for a user', async () => {
      const categories = [
        createMockCategory({ id: 'cat-1', name: 'Groceries' }),
        createMockCategory({ id: 'cat-2', name: 'Pets' }),
      ]
      prismaMock.category.findMany.mockResolvedValue(categories)

      const result = await getCustomCategories('test-user-id')

      expect(result).toHaveLength(2)
    })
  })

  describe('createCategory', () => {
    it('should create a new custom category', async () => {
      const newCat = createMockCategory({ name: 'Groceries', type: 'expense' })
      prismaMock.category.findFirst.mockResolvedValue(null) // No duplicate
      prismaMock.category.create.mockResolvedValue(newCat)

      const result = await createCategory('test-user-id', {
        name: 'Groceries',
        type: 'expense',
      })

      expect(result.name).toBe('Groceries')
      expect(prismaMock.category.create).toHaveBeenCalled()
    })

    it('should throw ConflictError if category already exists', async () => {
      prismaMock.category.findFirst.mockResolvedValue(
        createMockCategory({ name: 'Groceries' })
      )

      await expect(
        createCategory('test-user-id', { name: 'Groceries', type: 'expense' })
      ).rejects.toThrow(/already exists/)
    })

    it('should throw ConflictError if name matches a system category', async () => {
      prismaMock.category.findFirst.mockResolvedValue(null)

      await expect(
        createCategory('test-user-id', { name: 'salary', type: 'income' })
      ).rejects.toThrow(/system category/)
    })
  })

  describe('updateCategory', () => {
    it('should update an existing category', async () => {
      const existing = createMockCategory()
      prismaMock.category.findUnique.mockResolvedValue(existing)
      prismaMock.category.findFirst.mockResolvedValue(null) // No name conflict
      prismaMock.category.update.mockResolvedValue({
        ...existing,
        name: 'Updated Name',
      })

      const result = await updateCategory('test-user-id', 'test-category-id', {
        name: 'Updated Name',
      })

      expect(result.name).toBe('Updated Name')
    })

    it('should throw NotFoundError if category does not exist', async () => {
      prismaMock.category.findUnique.mockResolvedValue(null)

      await expect(
        updateCategory('test-user-id', 'nonexistent-id', { name: 'New' })
      ).rejects.toThrow('Category not found')
    })

    it('should throw AuthorizationError if category belongs to another user', async () => {
      prismaMock.category.findUnique.mockResolvedValue(
        createMockCategory({ userId: 'other-user-id' })
      )

      await expect(
        updateCategory('test-user-id', 'test-category-id', { name: 'New' })
      ).rejects.toThrow('You do not have access to this category')
    })
  })

  describe('deleteCategory', () => {
    it('should delete a category owned by the user', async () => {
      prismaMock.category.findUnique.mockResolvedValue(createMockCategory())
      prismaMock.category.delete.mockResolvedValue({})

      const result = await deleteCategory('test-user-id', 'test-category-id')

      expect(result).toEqual({ deleted: true })
    })

    it('should throw NotFoundError if category does not exist', async () => {
      prismaMock.category.findUnique.mockResolvedValue(null)

      await expect(
        deleteCategory('test-user-id', 'nonexistent-id')
      ).rejects.toThrow('Category not found')
    })

    it('should throw AuthorizationError if category belongs to another user', async () => {
      prismaMock.category.findUnique.mockResolvedValue(
        createMockCategory({ userId: 'other-user-id' })
      )

      await expect(
        deleteCategory('test-user-id', 'test-category-id')
      ).rejects.toThrow('You do not have access to this category')
    })
  })
})
