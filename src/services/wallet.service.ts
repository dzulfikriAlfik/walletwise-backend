/**
 * Wallet Service
 * Business logic for wallet management
 */

import { prisma } from '../config/database.js'
import { WALLET_LIMITS } from '../constants/subscription.js'
import type { SubscriptionTier } from '../constants/subscription.js'
import { NotFoundError, ConflictError, AuthorizationError, TrialExpiredError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import type { CreateWalletInput, UpdateWalletInput } from '../schemas/wallet.schemas.js'

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
    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    if (!user) {
      throw new NotFoundError('User')
    }

    // Fetch subscription from DB (tier, startDate, endDate for expiry logic)
    const subRows = await prisma.$queryRaw<
      Array<{ tier: string; startDate: Date; endDate: Date | null }>
    >`
      SELECT tier, "startDate", "endDate" FROM subscriptions WHERE "userId" = ${userId} LIMIT 1
    `
    const subRow = subRows[0]
    const rawTier = (subRow?.tier || 'free').toString().toLowerCase().replace(/-/g, '_').trim()
    let tier = rawTier as SubscriptionTier

    // Pro trial: unlimited when endDate > now; downgrade to free only when endDate has passed
    const now = new Date()
    const nowMs = now.getTime()
    let trialExpired = false
    if (tier === 'pro_trial') {
      const endVal = subRow?.endDate ?? null
      if (endVal) {
        const end = new Date(endVal)
        const endMs = end.getTime()
        if (!Number.isNaN(endMs) && endMs < nowMs) {
          tier = 'free'
          trialExpired = true
        }
      }
      // If pro_trial but no endDate: treat as active (unlimited)
    }

    const walletCount = await prisma.wallet.count({
      where: { userId },
    })
    // null = unlimited; use ?? only when key is missing (undefined)
    const limit = WALLET_LIMITS[tier]
    const maxWallets = limit === undefined ? 3 : limit

    if (maxWallets !== null && walletCount >= maxWallets) {
      if (trialExpired) {
        throw new TrialExpiredError(
          'Your Pro trial has ended. Please upgrade to Pro for unlimited wallets.'
        )
      }
      throw new AuthorizationError(
        tier === 'free'
          ? `Wallet limit reached (${maxWallets}). Upgrade to Pro for unlimited wallets.`
          : 'Pro trial has ended. Upgrade to Pro for unlimited wallets or delete extra wallets.'
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
