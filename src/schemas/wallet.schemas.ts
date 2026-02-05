/**
 * Wallet validation schemas
 */

import { z } from 'zod'

export const createWalletSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(50),
  balance: z.number().min(0, 'Balance cannot be negative'),
  currency: z.string().toUpperCase().min(3).max(3),
  color: z.string().optional(),
  icon: z.string().optional(),
})

export const updateWalletSchema = z.object({
  name: z.string().min(3).max(50).optional(),
  balance: z.number().min(0).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
})

export type CreateWalletInput = z.infer<typeof createWalletSchema>
export type UpdateWalletInput = z.infer<typeof updateWalletSchema>
