/**
 * Transaction validation schemas
 */

import { z } from 'zod'

export const createTransactionSchema = z.object({
  walletId: z.string().cuid('Invalid wallet ID'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1).max(200),
  date: z.string().datetime(),
})

export const updateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  amount: z.number().positive().optional(),
  description: z.string().max(200).optional(),
  date: z.string().datetime().optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
