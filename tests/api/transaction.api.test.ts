/**
 * API integration tests for Transaction endpoints
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import { createMockTransaction, createMockWallet, generateTestAccessToken } from '../helpers'

import supertest from 'supertest'
import app from '../../src/app'

const request = supertest(app)

describe('Transaction API Endpoints', () => {
  const token = generateTestAccessToken()

  beforeEach(() => {
    resetAllMocks()
  })

  describe('GET /api/v1/transactions', () => {
    it('should return 401 without auth', async () => {
      await request.get('/api/v1/transactions').expect(401)
    })

    it('should return 200 with transactions list', async () => {
      const transactions = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
      ]
      prismaMock.transaction.findMany.mockResolvedValue(transactions)

      const res = await request
        .get('/api/v1/transactions')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(2)
    })
  })

  describe('POST /api/v1/transactions', () => {
    const validBody = {
      walletId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'expense',
      category: 'food',
      amount: 25.5,
      description: 'Lunch at restaurant',
      date: '2025-01-15T12:00:00.000Z',
    }

    it('should return 201 for valid transaction', async () => {
      const wallet = createMockWallet({ id: validBody.walletId })
      prismaMock.wallet.findUnique.mockResolvedValue(wallet)

      const mockTx = createMockTransaction({ amount: 25.5 })
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          transaction: { create: jest.fn().mockResolvedValue(mockTx) },
          wallet: { update: jest.fn().mockResolvedValue({}) },
        })
      })

      const res = await request
        .post('/api/v1/transactions')
        .set('Cookie', `accessToken=${token}`)
        .send(validBody)
        .expect(201)

      expect(res.body.success).toBe(true)
    })

    it('should return 400 for invalid amount', async () => {
      const res = await request
        .post('/api/v1/transactions')
        .set('Cookie', `accessToken=${token}`)
        .send({ ...validBody, amount: -10 })
        .expect(400)

      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for missing required fields', async () => {
      const res = await request
        .post('/api/v1/transactions')
        .set('Cookie', `accessToken=${token}`)
        .send({ type: 'expense' })
        .expect(400)

      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('GET /api/v1/transactions/:id', () => {
    it('should return 200 for owned transaction', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(createMockTransaction())

      const res = await request
        .get('/api/v1/transactions/test-transaction-id')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
    })

    it('should return 404 for non-existent transaction', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(null)

      const res = await request
        .get('/api/v1/transactions/nonexistent')
        .set('Cookie', `accessToken=${token}`)
        .expect(404)

      expect(res.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('DELETE /api/v1/transactions/:id', () => {
    it('should return 200 for successful deletion', async () => {
      prismaMock.transaction.findUnique.mockResolvedValue(createMockTransaction())
      prismaMock.$transaction.mockImplementation(async (fn: any) => {
        return fn({
          transaction: { delete: jest.fn().mockResolvedValue({}) },
          wallet: { update: jest.fn().mockResolvedValue({}) },
        })
      })

      const res = await request
        .delete('/api/v1/transactions/test-transaction-id')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
    })
  })

  describe('GET /api/v1/transactions/summary', () => {
    it('should return transaction summary', async () => {
      prismaMock.transaction.findMany.mockResolvedValue([
        { type: 'income', category: 'salary', amount: 5000 },
        { type: 'expense', category: 'food', amount: 200 },
      ])

      const res = await request
        .get('/api/v1/transactions/summary')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.totalIncome).toBe(5000)
      expect(res.body.data.totalExpense).toBe(200)
    })
  })
})
