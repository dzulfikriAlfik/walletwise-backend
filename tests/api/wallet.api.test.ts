/**
 * API integration tests for Wallet endpoints
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import { createMockUser, createMockWallet, generateTestAccessToken } from '../helpers'

import supertest from 'supertest'
import app from '../../src/app'

const request = supertest(app)

describe('Wallet API Endpoints', () => {
  const token = generateTestAccessToken()

  beforeEach(() => {
    resetAllMocks()
  })

  describe('GET /api/v1/wallets', () => {
    it('should return 401 without auth', async () => {
      await request.get('/api/v1/wallets').expect(401)
    })

    it('should return 200 with user wallets', async () => {
      const wallets = [
        createMockWallet({ id: 'w1', name: 'Wallet 1' }),
        createMockWallet({ id: 'w2', name: 'Wallet 2' }),
      ]
      prismaMock.wallet.findMany.mockResolvedValue(wallets)

      const res = await request
        .get('/api/v1/wallets')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(2)
    })
  })

  describe('GET /api/v1/wallets/:id', () => {
    it('should return 200 for owned wallet', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(createMockWallet())

      const res = await request
        .get('/api/v1/wallets/test-wallet-id')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe('test-wallet-id')
    })

    it('should return 404 for non-existent wallet', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(null)

      const res = await request
        .get('/api/v1/wallets/nonexistent')
        .set('Cookie', `accessToken=${token}`)
        .expect(404)

      expect(res.body.error.code).toBe('NOT_FOUND')
    })

    it('should return 403 for wallet owned by another user', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(
        createMockWallet({ userId: 'other-user-id' })
      )

      const res = await request
        .get('/api/v1/wallets/test-wallet-id')
        .set('Cookie', `accessToken=${token}`)
        .expect(403)

      expect(res.body.error.code).toBe('AUTHORIZATION_ERROR')
    })
  })

  describe('POST /api/v1/wallets', () => {
    const validBody = {
      name: 'New Wallet',
      balance: 100,
      currency: 'USD',
    }

    it('should return 201 for valid wallet creation', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser())
      prismaMock.$queryRaw.mockResolvedValue([
        { tier: 'pro', startDate: new Date(), endDate: null },
      ])
      prismaMock.wallet.count.mockResolvedValue(0)
      prismaMock.wallet.findUnique.mockResolvedValue(null)
      prismaMock.wallet.create.mockResolvedValue(
        createMockWallet({ name: 'New Wallet', balance: 100 })
      )
      prismaMock.transaction.create.mockResolvedValue({})

      const res = await request
        .post('/api/v1/wallets')
        .set('Cookie', `accessToken=${token}`)
        .send(validBody)
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe('New Wallet')
    })

    it('should return 400 for invalid data', async () => {
      const res = await request
        .post('/api/v1/wallets')
        .set('Cookie', `accessToken=${token}`)
        .send({ name: 'AB', balance: -10, currency: 'TOOLONG' })
        .expect(400)

      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PATCH /api/v1/wallets/:id', () => {
    it('should return 200 for valid update', async () => {
      const wallet = createMockWallet({ balance: 100 })
      prismaMock.wallet.findUnique
        .mockResolvedValueOnce(wallet)
        .mockResolvedValueOnce(null)
      prismaMock.wallet.update.mockResolvedValue({
        ...wallet,
        balance: 200,
      })
      prismaMock.transaction.create.mockResolvedValue({})

      const res = await request
        .patch('/api/v1/wallets/test-wallet-id')
        .set('Cookie', `accessToken=${token}`)
        .send({ balance: 200 })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.balance).toBe(200)
    })

    it('should return 400 for invalid update data', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(createMockWallet())

      const res = await request
        .patch('/api/v1/wallets/test-wallet-id')
        .set('Cookie', `accessToken=${token}`)
        .send({ name: 'A' })
        .expect(400)

      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('DELETE /api/v1/wallets/:id', () => {
    it('should return 200 for successful deletion', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(createMockWallet())
      prismaMock.wallet.delete.mockResolvedValue(createMockWallet())

      const res = await request
        .delete('/api/v1/wallets/test-wallet-id')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
    })
  })

  describe('GET /api/v1/wallets/summary', () => {
    it('should return wallet summary', async () => {
      prismaMock.wallet.findMany.mockResolvedValue([
        { id: 'w1', name: 'W1', balance: 500, currency: 'USD' },
        { id: 'w2', name: 'W2', balance: 300, currency: 'USD' },
      ])

      const res = await request
        .get('/api/v1/wallets/summary')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.totalBalance).toBe(800)
      expect(res.body.data.totalWallets).toBe(2)
    })
  })
})
