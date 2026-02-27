/**
 * API integration tests for Auth endpoints
 * Tests HTTP layer using supertest with mocked services
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import {
  createMockUser,
  createMockSubscription,
  generateTestAccessToken,
} from '../helpers'

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: jest.fn(),
}))

import bcrypt from 'bcryptjs'
import supertest from 'supertest'
import app from '../../src/app'

const request = supertest(app)

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  describe('POST /api/v1/auth/register', () => {
    const validBody = {
      email: 'new@example.com',
      name: 'New User',
      password: 'Test@1234',
    }

    it('should return 201 for valid registration', async () => {
      const mockUser = createMockUser({
        email: validBody.email,
        name: validBody.name,
        subscription: createMockSubscription(),
      })
      prismaMock.user.findUnique.mockResolvedValue(null)
      prismaMock.user.create.mockResolvedValue(mockUser)

      const res = await request
        .post('/api/v1/auth/register')
        .send(validBody)
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.user.email).toBe(validBody.email)
    })

    it('should return 400 for invalid email', async () => {
      const res = await request
        .post('/api/v1/auth/register')
        .send({ ...validBody, email: 'not-an-email' })
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for weak password', async () => {
      const res = await request
        .post('/api/v1/auth/register')
        .send({ ...validBody, password: '12345678' })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should return 409 if user already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser())

      const res = await request
        .post('/api/v1/auth/register')
        .send(validBody)
        .expect(409)

      expect(res.body.error.code).toBe('CONFLICT')
    })

    it('should set httpOnly cookies on success', async () => {
      const mockUser = createMockUser({
        subscription: createMockSubscription(),
      })
      prismaMock.user.findUnique.mockResolvedValue(null)
      prismaMock.user.create.mockResolvedValue(mockUser)

      const res = await request
        .post('/api/v1/auth/register')
        .send(validBody)
        .expect(201)

      const cookies = res.headers['set-cookie']
      expect(cookies).toBeDefined()
      const cookieStr = Array.isArray(cookies) ? cookies.join('; ') : cookies
      expect(cookieStr).toContain('accessToken')
      expect(cookieStr).toContain('refreshToken')
    })
  })

  describe('POST /api/v1/auth/login', () => {
    const validBody = {
      email: 'test@example.com',
      password: 'Test@1234',
    }

    it('should return 200 for valid login', async () => {
      const mockUser = createMockUser({
        subscription: createMockSubscription(),
      })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const res = await request
        .post('/api/v1/auth/login')
        .send(validBody)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.user).toBeDefined()
    })

    it('should return 401 for wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        createMockUser({ subscription: createMockSubscription() })
      )
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const res = await request
        .post('/api/v1/auth/login')
        .send(validBody)
        .expect(401)

      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should return 401 for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const res = await request
        .post('/api/v1/auth/login')
        .send(validBody)
        .expect(401)

      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR')
    })
  })

  describe('GET /api/v1/auth/profile', () => {
    it('should return 401 without auth token', async () => {
      const res = await request
        .get('/api/v1/auth/profile')
        .expect(401)

      expect(res.body.error.code).toBe('AUTHENTICATION_ERROR')
    })

    it('should return 200 with valid auth token', async () => {
      const mockUser = createMockUser({
        subscription: createMockSubscription(),
      })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      prismaMock.$queryRaw.mockResolvedValue([
        { transactionTimeRange: 'weekly', firstDayOfWeek: 0 },
      ])

      const token = generateTestAccessToken()

      const res = await request
        .get('/api/v1/auth/profile')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.email).toBe(mockUser.email)
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    it('should return 200 and clear cookies', async () => {
      const token = generateTestAccessToken()

      const res = await request
        .post('/api/v1/auth/logout')
        .set('Cookie', `accessToken=${token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Logged out successfully')
    })
  })

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 400 when refresh token missing', async () => {
      const res = await request.post('/api/v1/auth/refresh').expect(400)

      expect(res.body.error.code).toBe('VALIDATION_ERROR')
    })

    it('should return 200 with new access token', async () => {
      const { generateTestRefreshToken } = await import('../helpers')
      const refreshToken = generateTestRefreshToken()
      const mockUser = createMockUser({
        subscription: createMockSubscription(),
      })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)

      const res = await request
        .post('/api/v1/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Token refreshed successfully')
      expect(res.headers['set-cookie']).toBeDefined()
    })
  })

  describe('PATCH /api/v1/auth/profile', () => {
    it('should return 200 for valid profile update', async () => {
      const mockUser = createMockUser({
        subscription: createMockSubscription(),
      })
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
        preferredCurrency: 'IDR',
        subscription: createMockSubscription(),
      }
      prismaMock.user.update.mockResolvedValue(updatedUser)
      prismaMock.$queryRaw.mockResolvedValue([
        { transactionTimeRange: 'weekly', firstDayOfWeek: 0 },
      ])

      const token = generateTestAccessToken()

      const res = await request
        .patch('/api/v1/auth/profile')
        .set('Cookie', `accessToken=${token}`)
        .send({ name: 'Updated Name', preferredCurrency: 'IDR' })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe('Updated Name')
    })

    it('should return 200 when updating transaction settings', async () => {
      const mockUser = createMockUser({
        subscription: createMockSubscription(),
      })
      const updatedUser = {
        ...mockUser,
        subscription: createMockSubscription(),
      }
      prismaMock.user.update.mockResolvedValue(updatedUser)
      prismaMock.$executeRaw.mockResolvedValue(0)
      prismaMock.$queryRaw.mockResolvedValue([
        { transactionTimeRange: 'monthly', firstDayOfWeek: 1 },
      ])

      const token = generateTestAccessToken()

      const res = await request
        .patch('/api/v1/auth/profile')
        .set('Cookie', `accessToken=${token}`)
        .send({
          transactionTimeRange: 'monthly',
          firstDayOfWeek: 1,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.transactionTimeRange).toBe('monthly')
      expect(res.body.data.firstDayOfWeek).toBe(1)
    })
  })
})
