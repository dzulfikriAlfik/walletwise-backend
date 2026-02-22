import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: z.enum(['income', 'expense']),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  type: z.enum(['income', 'expense']).optional(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
