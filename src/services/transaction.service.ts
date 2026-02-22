/**
 * Transaction Service
 * Business logic for transaction management
 */

import { prisma } from '../config/database.js'
import { NotFoundError, AuthorizationError } from '../utils/errors.js'
import { logger } from '../utils/logger.js'
import type { CreateTransactionInput, UpdateTransactionInput } from '../schemas/transaction.schemas.js'

interface TransactionFilters {
  walletId?: string
  type?: 'income' | 'expense'
  category?: string
  startDate?: Date
  endDate?: Date
}

interface TransactionSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
  byCategory: Array<{
    category: string
    total: number
    count: number
  }>
}

export class TransactionService {
  /**
   * Get all transactions for a user with optional filters
   */
  async getAll(userId: string, filters?: TransactionFilters) {
    logger.info('Transaction operation: getAll', { userId, filters: filters ? Object.keys(filters) : [] })
    const where: any = { userId }

    if (filters?.walletId) {
      where.walletId = filters.walletId
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) {
        where.date.gte = filters.startDate
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        wallet: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    return transactions
  }

  /**
   * Get a single transaction by ID
   */
  async getById(userId: string, transactionId: string) {
    logger.info('Transaction operation: getById', { userId, transactionId })
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: {
          select: {
            id: true,
            name: true,
            currency: true,
          },
        },
      },
    })

    if (!transaction) {
      throw new NotFoundError('Transaction')
    }

    // Check if transaction belongs to user
    if (transaction.userId !== userId) {
      throw new AuthorizationError('You do not have access to this transaction')
    }

    return transaction
  }

  /**
   * Create a new transaction
   */
  async create(userId: string, data: CreateTransactionInput) {
    logger.info('Transaction operation: create', { userId, walletId: data.walletId, type: data.type, amount: data.amount })
    // Verify wallet exists and belongs to user
    const wallet = await prisma.wallet.findUnique({
      where: { id: data.walletId },
    })

    if (!wallet) {
      throw new NotFoundError('Wallet')
    }

    if (wallet.userId !== userId) {
      throw new AuthorizationError('You do not have access to this wallet')
    }

    // Calculate new balance
    const balanceChange = data.type === 'income' ? data.amount : -data.amount
    const newBalance = wallet.balance + balanceChange

    // Create transaction and update wallet balance in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: data.walletId,
          type: data.type,
          category: data.category,
          amount: data.amount,
          description: data.description,
          date: new Date(data.date),
        },
        include: {
          wallet: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
        },
      })

      // Update wallet balance
      await tx.wallet.update({
        where: { id: data.walletId },
        data: { balance: newBalance },
      })

      return transaction
    })

    return result
  }

  /**
   * Update a transaction
   */
  async update(userId: string, transactionId: string, data: UpdateTransactionInput) {
    logger.info('Transaction operation: update', { userId, transactionId, fields: Object.keys(data) })
    // Get existing transaction
    const existingTransaction = await this.getById(userId, transactionId)

    // Calculate balance adjustments
    let balanceAdjustment = 0

    // If amount or type changed, recalculate balance
    if (data.amount !== undefined || data.type !== undefined) {
      const oldAmount = existingTransaction.amount
      const oldType = existingTransaction.type
      const newAmount = data.amount ?? oldAmount
      const newType = data.type ?? oldType

      // Revert old transaction effect
      const oldEffect = oldType === 'income' ? oldAmount : -oldAmount
      // Apply new transaction effect
      const newEffect = newType === 'income' ? newAmount : -newAmount

      balanceAdjustment = newEffect - oldEffect
    }

    // Update transaction and wallet balance in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update transaction
      const transaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          ...(data.type && { type: data.type }),
          ...(data.category && { category: data.category }),
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.description && { description: data.description }),
          ...(data.date && { date: new Date(data.date) }),
        },
        include: {
          wallet: {
            select: {
              id: true,
              name: true,
              currency: true,
            },
          },
        },
      })

      // Update wallet balance if needed
      if (balanceAdjustment !== 0) {
        await tx.wallet.update({
          where: { id: existingTransaction.walletId },
          data: {
            balance: {
              increment: balanceAdjustment,
            },
          },
        })
      }

      return transaction
    })

    return result
  }

  /**
   * Delete a transaction
   */
  async delete(userId: string, transactionId: string) {
    logger.info('Transaction operation: delete', { userId, transactionId })
    // Get existing transaction
    const transaction = await this.getById(userId, transactionId)

    // Calculate balance adjustment (revert transaction)
    const balanceAdjustment = transaction.type === 'income' 
      ? -transaction.amount 
      : transaction.amount

    // Delete transaction and update wallet balance
    await prisma.$transaction(async (tx: any) => {
      // Delete transaction
      await tx.transaction.delete({
        where: { id: transactionId },
      })

      // Update wallet balance
      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: {
            increment: balanceAdjustment,
          },
        },
      })
    })

    return { success: true, message: 'Transaction deleted successfully' }
  }

  /**
   * Get transaction summary
   */
  async getSummary(userId: string, filters?: TransactionFilters): Promise<TransactionSummary> {
    logger.info('Transaction operation: getSummary', { userId, filters: filters ? Object.keys(filters) : [] })
    const where: any = { userId }

    if (filters?.walletId) {
      where.walletId = filters.walletId
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) {
        where.date.gte = filters.startDate
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        type: true,
        category: true,
        amount: true,
      },
    })

    // Calculate totals
    let totalIncome = 0
    let totalExpense = 0

    const categoryMap = new Map<string, { total: number; count: number }>()

    transactions.forEach((t: { type: string; category: string; amount: number }) => {
      if (t.type === 'income') {
        totalIncome += t.amount
      } else {
        totalExpense += t.amount
      }

      // Group by category
      const existing = categoryMap.get(t.category) || { total: 0, count: 0 }
      categoryMap.set(t.category, {
        total: existing.total + t.amount,
        count: existing.count + 1,
      })
    })

    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
    }))

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
      byCategory,
    }
  }

  /**
   * Get analytics data for Pro+ users
   * Spending by category, income vs expense over time, etc.
   */
  async getAnalytics(userId: string, filters?: TransactionFilters) {
    logger.info('Transaction operation: getAnalytics', {
      userId,
      filters: filters ? Object.keys(filters) : [],
    })

    const where: any = { userId }

    if (filters?.walletId) where.walletId = filters.walletId
    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) where.date.gte = filters.startDate
      if (filters.endDate) where.date.lte = filters.endDate
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        wallet: { select: { id: true, name: true, currency: true } },
      },
      orderBy: { date: 'asc' },
    })

    // By category (expense categories only for spending breakdown)
    const expenseByCategory = new Map<string, number>()
    const incomeByCategory = new Map<string, number>()

    let totalIncome = 0
    let totalExpense = 0

    // By month for trend
    const byMonth = new Map<
      string,
      { income: number; expense: number; balance: number }
    >()

    transactions.forEach((t: any) => {
      if (t.type === 'income') {
        totalIncome += t.amount
        incomeByCategory.set(
          t.category,
          (incomeByCategory.get(t.category) ?? 0) + t.amount
        )
      } else {
        totalExpense += t.amount
        expenseByCategory.set(
          t.category,
          (expenseByCategory.get(t.category) ?? 0) + t.amount
        )
      }

      const monthKey = t.date.toISOString().slice(0, 7)
      const month = byMonth.get(monthKey) ?? {
        income: 0,
        expense: 0,
        balance: 0,
      }
      if (t.type === 'income') {
        month.income += t.amount
      } else {
        month.expense += t.amount
      }
      month.balance = month.income - month.expense
      byMonth.set(monthKey, month)
    })

    const spendingByCategory = Array.from(expenseByCategory.entries()).map(
      ([category, total]) => ({ category, total })
    )
    const incomeByCategoryList = Array.from(incomeByCategory.entries()).map(
      ([category, total]) => ({ category, total })
    )
    const monthlyTrend = Array.from(byMonth.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return {
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: transactions.length,
      },
      spendingByCategory,
      incomeByCategory: incomeByCategoryList,
      monthlyTrend,
    }
  }

  /**
   * Export transactions as CSV or Excel (Pro+)
   */
  async exportTransactions(
    userId: string,
    format: 'csv' | 'excel',
    filters?: TransactionFilters
  ): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
    logger.info('Transaction operation: exportTransactions', {
      userId,
      format,
      filters: filters ? Object.keys(filters) : [],
    })

    const transactions = await this.getAll(userId, filters)

    const rows = transactions.map((t: any) => ({
      Date: t.date.toISOString().slice(0, 10),
      Type: t.type,
      Category: t.category,
      Amount: t.amount,
      Currency: t.wallet?.currency ?? 'USD',
      Description: t.description ?? '',
      Wallet: t.wallet?.name ?? '',
    }))

    if (format === 'csv') {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(rows)
      const csv = XLSX.utils.sheet_to_csv(ws)
      const buffer = Buffer.from(csv, 'utf-8')
      const filename = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
      return { buffer, filename, contentType: 'text/csv' }
    }

    // Excel
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    const filename = `transactions-${new Date().toISOString().slice(0, 10)}.xlsx`
    return {
      buffer,
      filename,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }
  }
}

export const transactionService = new TransactionService()
