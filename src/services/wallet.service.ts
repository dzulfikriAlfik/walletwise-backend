/**
 * Wallet Service
 * Business logic for wallet management
 */

import { prisma } from '@/config/database'
import { WALLET_LIMITS } from '@/constants/subscription'
import type { SubscriptionTier } from '@/constants/subscription'
import { NotFoundError, ConflictError, AuthorizationError } from '@/utils/errors'
import { logger } from '@/utils/logger'
import type { CreateWalletInput, UpdateWalletInput } from '@/schemas/wallet.schemas'

interface WalletSummary {
  totalBalance: number
  totalWallets: number
  wallets: Array<{
    id: string
    name: string
    balance: number
    currency: string
  }>
}

export class WalletService {
  /**
   * Get all wallets for a user
   */
  async getAll(userId: string) {
    logger.info('Wallet operation: getAll', { userId })
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return wallets
  }

  /**
   * Get a single wallet by ID
   */
  async getById(userId: string, walletId: string) {
    logger.info('Wallet operation: getById', { userId, walletId })
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    })

    if (!wallet) {
      throw new NotFoundError('Wallet')
    }

    // Check if wallet belongs to user
    if (wallet.userId !== userId) {
      throw new AuthorizationError('You do not have access to this wallet')
    }

    return wallet
  }

  /**
   * Create a new wallet
   */
  async create(userId: string, data: CreateWalletInput) {
    logger.info('Wallet operation: create', { userId, name: data.name, currency: data.currency })
    // Check user's subscription tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    // Check wallet limit based on subscription (free: 3, pro/pro_plus: unlimited)
    const walletCount = await prisma.wallet.count({
      where: { userId },
    })

    const tier = (user.subscription?.tier || 'free') as SubscriptionTier
    const maxWallets = WALLET_LIMITS[tier] ?? 3

    if (maxWallets !== null && walletCount >= maxWallets) {
      throw new AuthorizationError(
        `Wallet limit reached (${maxWallets}). Upgrade to Pro for unlimited wallets.`
      )
    }

    // Check if wallet name already exists for this user
    const existingWallet = await prisma.wallet.findUnique({
      where: {
        userId_name: {
          userId,
          name: data.name,
        },
      },
    })

    if (existingWallet) {
      throw new ConflictError('Wallet with this name already exists')
    }

    // Create wallet
    const wallet = await prisma.wallet.create({
      data: {
        userId,
        name: data.name,
        balance: data.balance,
        currency: data.currency,
        color: data.color,
        icon: data.icon,
      },
    })

    return wallet
  }

  /**
   * Update a wallet
   */
  async update(userId: string, walletId: string, data: UpdateWalletInput) {
    logger.info('Wallet operation: update', { userId, walletId, fields: Object.keys(data) })
    // Check if wallet exists and belongs to user
    const existingWallet = await this.getById(userId, walletId)

    // If updating name, check for duplicates
    if (data.name && data.name !== existingWallet.name) {
      const duplicateWallet = await prisma.wallet.findUnique({
        where: {
          userId_name: {
            userId,
            name: data.name,
          },
        },
      })

      if (duplicateWallet) {
        throw new ConflictError('Wallet with this name already exists')
      }
    }

    // Update wallet
    const wallet = await prisma.wallet.update({
      where: { id: walletId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.balance !== undefined && { balance: data.balance }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
      },
    })

    return wallet
  }

  /**
   * Delete a wallet
   */
  async delete(userId: string, walletId: string) {
    logger.info('Wallet operation: delete', { userId, walletId })
    // Check if wallet exists and belongs to user
    await this.getById(userId, walletId)

    // Delete wallet (transactions will be cascade deleted)
    await prisma.wallet.delete({
      where: { id: walletId },
    })

    return { success: true, message: 'Wallet deleted successfully' }
  }

  /**
   * Get wallet summary
   */
  async getSummary(userId: string): Promise<WalletSummary> {
    logger.info('Wallet operation: getSummary', { userId })
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        balance: true,
        currency: true,
      },
    })

    // Calculate total balance (assumes all in same currency, or would need conversion)
    const totalBalance = wallets.reduce((sum: number, wallet: { balance: number }) => sum + wallet.balance, 0)

    return {
      totalBalance,
      totalWallets: wallets.length,
      wallets,
    }
  }
}

export const walletService = new WalletService()
