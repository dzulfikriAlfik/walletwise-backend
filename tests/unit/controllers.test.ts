/**
 * Unit tests for controllers - covers error path branches (no userId, validation)
 */

import '../setup'
import { resetAllMocks } from '../mocks/prisma.mock'

import type { Request, Response } from 'express'
import { walletController } from '../../src/controllers/wallet.controller'
import { transactionController } from '../../src/controllers/transaction.controller'
import * as categoryController from '../../src/controllers/category.controller'
import { paymentController } from '../../src/controllers/payment.controller'

function createMockReq(overrides: Partial<Request> = {}): Request {
  return {
    user: undefined,
    params: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request
}

function createMockRes(): Response {
  const res = {} as Response
  res.status = jest.fn().mockReturnThis()
  res.json = jest.fn().mockReturnThis()
  res.setHeader = jest.fn().mockReturnThis()
  res.send = jest.fn().mockReturnThis()
  return res
}

describe('Controller error branches', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('WalletController', () => {
    it('should call next with error when userId missing in getAll', async () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      await walletController.getAll(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in getById', async () => {
      const req = createMockReq({ params: { id: 'w1' } })
      const res = createMockRes()
      const next = jest.fn()

      await walletController.getById(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in create', async () => {
      const req = createMockReq({
        body: { name: 'Wallet', balance: 100, currency: 'USD' },
      })
      const res = createMockRes()
      const next = jest.fn()

      await walletController.create(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in update', async () => {
      const req = createMockReq({
        params: { id: 'w1' },
        body: { name: 'Updated' },
      })
      const res = createMockRes()
      const next = jest.fn()

      await walletController.update(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in getSummary', async () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      await walletController.getSummary(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in delete', async () => {
      const req = createMockReq({ params: { id: 'w1' } })
      const res = createMockRes()
      const next = jest.fn()

      await walletController.delete(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })
  })

  describe('TransactionController', () => {
    it('should call next with error when userId missing in getAll', async () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      await transactionController.getAll(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in getById', async () => {
      const req = createMockReq({ params: { id: 'tx1' } })
      const res = createMockRes()
      const next = jest.fn()

      await transactionController.getById(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in create', async () => {
      const req = createMockReq({
        body: {
          walletId: 'w1',
          type: 'expense',
          category: 'food',
          amount: 100,
          date: '2025-01-15',
        },
      })
      const res = createMockRes()
      const next = jest.fn()

      await transactionController.create(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in getSummary', async () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      await transactionController.getSummary(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in update', async () => {
      const req = createMockReq({
        params: { id: 'tx1' },
        body: { amount: 100 },
      })
      const res = createMockRes()
      const next = jest.fn()

      await transactionController.update(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in delete', async () => {
      const req = createMockReq({ params: { id: 'tx1' } })
      const res = createMockRes()
      const next = jest.fn()

      await transactionController.delete(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in getAnalytics', async () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      await transactionController.getAnalytics(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in exportTransactions', async () => {
      const req = createMockReq({ query: { format: 'csv' } })
      const res = createMockRes()
      const next = jest.fn()

      await transactionController.exportTransactions(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error for invalid export format', async () => {
      const req = createMockReq({
        user: { userId: 'test-user-id', email: 'test@test.com' },
        query: { format: 'pdf' },
      })
      const res = createMockRes()
      const next = jest.fn()

      await transactionController.exportTransactions(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid format'),
        })
      )
    })
  })

  describe('CategoryController', () => {
    it('should call next with error when userId missing in getAll', async () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      await categoryController.getAll(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in getCustom', async () => {
      const req = createMockReq()
      const res = createMockRes()
      const next = jest.fn()

      await categoryController.getCustom(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in create', async () => {
      const req = createMockReq({
        body: { name: 'Food', type: 'expense' },
      })
      const res = createMockRes()
      const next = jest.fn()

      await categoryController.create(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in update', async () => {
      const req = createMockReq({
        params: { id: 'cat-1' },
        body: { name: 'Updated' },
      })
      const res = createMockRes()
      const next = jest.fn()

      await categoryController.update(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })

    it('should call next with error when userId missing in remove', async () => {
      const req = createMockReq({ params: { id: 'cat-1' } })
      const res = createMockRes()
      const next = jest.fn()

      await categoryController.remove(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })
  })

  describe('PaymentController', () => {
    it('should call next with error when userId missing in create', async () => {
      const req = createMockReq({
        body: {
          targetTier: 'pro',
          billingPeriod: 'monthly',
          gateway: 'stripe',
          method: 'card',
        },
      })
      const res = createMockRes()
      const next = jest.fn()

      await paymentController.create(req, res, next)

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User ID not found'),
        })
      )
    })
  })
})
