/**
 * Unit tests for TransactionService
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import { createMockTransaction, createMockWallet } from '../helpers'

import { TransactionService } from '../../src/services/transaction.service'

describe('TransactionService', () => {
  let transactionService: TransactionService

  beforeEach(() => {
    resetAllMocks()
    transactionService = new TransactionService()
  })

  describe('getAll', () => {
    it('should return all transactions for a user', async () => {
      const transactions = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2', type: 'income', category: 'salary', amount: 3000 }),
      ]
      prismaMock.transaction.findMany.mockResolvedValue(transactions)

      const result = await transactionService.getAll('test-user-id')

      expect(result).toHaveLength(2)
    })

    it('should apply filters when provided', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([])

      await transactionService.getAll('test-user-id', {
        walletId: 'wallet-1',
        type: 'expense',
        category: 'food',
      })

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'test-user-id',
            walletId: 'wallet-1',
            type: 'expense',
            category: 'food',
          }),
        })
      )
    })

    it('should apply date range filters', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([])

      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      await transactionService.getAll('test-user-id', { startDate, endDate })

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: { gte: startDate, lte: endDate },
          }),
        })
      )
    })
  })

  describe('getById', () => {
    it('should return a transaction if it belongs to the user', async () => {
      const tx = createMockTransaction()
      prismaMock.transaction.findUnique.mockResolvedValue(tx)

      const result = await transactionService.getById('test-user-id', 'test-transaction-id')

      expect(result).toEqual(tx)
    })

    it('should throw NotFoundError if transaction does not exist', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null)

      await expect(
        transactionService.getById('test-user-id', 'nonexistent-id')
      ).rejects.toThrow('Transaction not found')
    })

    it('should throw AuthorizationError if transaction belongs to another user', async () => {
      const tx = createMockTransaction({ userId: 'other-user-id' })
      prismaMock.transaction.findUnique.mockResolvedValue(tx)

      await expect(
        transactionService.getById('test-user-id', 'test-transaction-id')
      ).rejects.toThrow('You do not have access to this transaction')
    })
  })

  describe('create', () => {
    const createData = {
      walletId: 'test-wallet-id',
      type: 'expense' as const,
      category: 'food',
      amount: 25,
      description: 'Lunch',
      date: '2025-01-15T12:00:00.000Z',
    }

    it('should create a transaction and update wallet balance', async () => {
      const wallet = createMockWallet({ balance: 1000 })
      prismaMock.wallet.findUnique.mockResolvedValue(wallet)

      const mockTx = createMockTransaction({ amount: 25 })
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          transaction: { create: jest.fn().mockResolvedValue(mockTx) },
          wallet: { update: jest.fn().mockResolvedValue({}) },
        })
      })

      const result = await transactionService.create('test-user-id', createData)

      expect(result).toEqual(mockTx)
      expect(prismaMock.$transaction).toHaveBeenCalled()
    })

    it('should throw NotFoundError if wallet does not exist', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(null)

      await expect(
        transactionService.create('test-user-id', createData)
      ).rejects.toThrow('Wallet not found')
    })

    it('should throw AuthorizationError if wallet belongs to another user', async () => {
      const wallet = createMockWallet({ userId: 'other-user-id' })
      prismaMock.wallet.findUnique.mockResolvedValue(wallet)

      await expect(
        transactionService.create('test-user-id', createData)
      ).rejects.toThrow('You do not have access to this wallet')
    })

    it('should calculate correct balance for income transaction', async () => {
      const wallet = createMockWallet({ balance: 1000 })
      prismaMock.wallet.findUnique.mockResolvedValue(wallet)

      const incomeData = { ...createData, type: 'income' as const, amount: 500 }
      const mockTx = createMockTransaction({ type: 'income', amount: 500 })

      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          transaction: { create: jest.fn().mockResolvedValue(mockTx) },
          wallet: {
            update: jest.fn().mockImplementation((args: any) => {
              // Balance should be 1000 + 500 = 1500
              expect(args.data.balance).toBe(1500)
              return {}
            }),
          },
        })
      })

      await transactionService.create('test-user-id', incomeData)
    })
  })

  describe('delete', () => {
    it('should delete transaction and adjust wallet balance', async () => {
      const tx = createMockTransaction({ type: 'expense', amount: 50 })
      prismaMock.transaction.findUnique.mockResolvedValue(tx)

      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          transaction: { delete: jest.fn().mockResolvedValue({}) },
          wallet: { update: jest.fn().mockResolvedValue({}) },
        })
      })

      const result = await transactionService.delete('test-user-id', 'test-transaction-id')

      expect(result).toEqual({
        success: true,
        message: 'Transaction deleted successfully',
      })
    })
  })

  describe('getSummary', () => {
    it('should calculate correct totals', async () => {
      const transactions = [
        { type: 'income', category: 'salary', amount: 5000 },
        { type: 'expense', category: 'food', amount: 200 },
        { type: 'expense', category: 'transport', amount: 100 },
        { type: 'expense', category: 'food', amount: 150 },
      ]
      prismaMock.transaction.findMany.mockResolvedValue(transactions)

      const result = await transactionService.getSummary('test-user-id')

      expect(result.totalIncome).toBe(5000)
      expect(result.totalExpense).toBe(450)
      expect(result.balance).toBe(4550)
      expect(result.transactionCount).toBe(4)
      expect(result.byCategory).toHaveLength(3) // salary, food, transport
    })

    it('should return zeros when there are no transactions', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([])

      const result = await transactionService.getSummary('test-user-id')

      expect(result.totalIncome).toBe(0)
      expect(result.totalExpense).toBe(0)
      expect(result.balance).toBe(0)
      expect(result.transactionCount).toBe(0)
    })
  })
})
