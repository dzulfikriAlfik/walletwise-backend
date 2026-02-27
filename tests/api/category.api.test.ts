/**
 * API integration tests for Category endpoints
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import {
  createMockCategory,
  createMockSubscription,
  generateTestAccessToken,
} from '../helpers'

import supertest from 'supertest'
import app from '../../src/app'

const request = supertest(app)

describe('Category API Endpoints', () => {
  const token = generateTestAccessToken()

  beforeEach(() => {
    resetAllMocks()
  })

  describe('GET /api/v1/categories', () => {
    it('should return 401 without auth', async () => {
      await request.get('/api/v1/categories').expect(401)
    })

    it('should return 200 with categories (system + custom)', async () => {
      prismaMock.category.findMany.mockResolvedValue([
        createMockCategory({ name: 'Custom Food' }),
      ])

      const res = await request
        .get('/api/v1/categories')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toBeDefined()
    })
  })

  describe('GET /api/v1/categories/custom', () => {
    it('should return 200 with custom categories for Pro user', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'pro' })
      )
      prismaMock.category.findMany.mockResolvedValue([
        createMockCategory({ name: 'Custom Food', type: 'expense' }),
      ])

      const res = await request
        .get('/api/v1/categories/custom')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toBeDefined()
    })

    it('should return 403 for Free user', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'free' })
      )

      const res = await request
        .get('/api/v1/categories/custom')
        .set('Cookie', `accessToken=${token}`)
        .expect(403)

      expect(res.body.error.code).toBe('AUTHORIZATION_ERROR')
    })
  })

  describe('POST /api/v1/categories', () => {
    const validBody = { name: 'Custom Food', type: 'expense' as const }

    it('should return 201 for valid category creation', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'pro' })
      )
      prismaMock.category.create.mockResolvedValue(
        createMockCategory({ name: 'Custom Food', type: 'expense' })
      )

      const res = await request
        .post('/api/v1/categories')
        .set('Cookie', `accessToken=${token}`)
        .send(validBody)
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe('Custom Food')
    })

    it('should return 400 for invalid data', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'pro' })
      )

      const res = await request
        .post('/api/v1/categories')
        .set('Cookie', `accessToken=${token}`)
        .send({ name: '', type: 'invalid' })
        .expect(400)

      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('PATCH /api/v1/categories/:id', () => {
    it('should return 400 for invalid update body', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'pro' })
      )

      const res = await request
        .patch('/api/v1/categories/cat-1')
        .set('Cookie', `accessToken=${token}`)
        .send({ name: '' })
        .expect(400)

      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 200 for valid update', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'pro' })
      )
      prismaMock.category.findUnique.mockResolvedValue(
        createMockCategory({ id: 'cat-1', userId: 'test-user-id' })
      )
      prismaMock.category.findFirst.mockResolvedValue(null)
      prismaMock.category.update.mockResolvedValue(
        createMockCategory({ id: 'cat-1', name: 'Updated Food' })
      )

      const res = await request
        .patch('/api/v1/categories/cat-1')
        .set('Cookie', `accessToken=${token}`)
        .send({ name: 'Updated Food' })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe('Updated Food')
    })
  })

  describe('DELETE /api/v1/categories/:id', () => {
    it('should return 200 for successful deletion', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue(
        createMockSubscription({ tier: 'pro' })
      )
      prismaMock.category.findUnique.mockResolvedValue(
        createMockCategory({ id: 'cat-1', userId: 'test-user-id' })
      )
      prismaMock.category.delete.mockResolvedValue(
        createMockCategory({ id: 'cat-1' })
      )

      const res = await request
        .delete('/api/v1/categories/cat-1')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.deleted).toBe(true)
    })
  })
})
