/**
 * Unit tests for AuthService
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import { createMockUser, createMockSubscription } from '../helpers'

// Must import AFTER mocks are set up
import { AuthService } from '../../src/services/auth.service'

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: jest.fn(),
}))

// Mock jwt utils
jest.mock('../../src/utils/jwt', () => ({
  generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
  verifyRefreshToken: jest.fn(),
}))

import bcrypt from 'bcryptjs'
import { generateAccessToken, verifyRefreshToken } from '../../src/utils/jwt'

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    resetAllMocks()
    authService = new AuthService()
  })

  describe('register', () => {
    const registerData = {
      email: 'new@example.com',
      name: 'New User',
      password: 'Test@1234',
    }

    it('should register a new user successfully', async () => {
      const mockUser = createMockUser({
        email: registerData.email,
        name: registerData.name,
        subscription: createMockSubscription(),
      })

      prismaMock.user.findUnique.mockResolvedValue(null) // No existing user
      prismaMock.user.create.mockResolvedValue(mockUser)

      const result = await authService.register(registerData)

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerData.email },
      })
      expect(prismaMock.user.create).toHaveBeenCalled()
      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken', 'mock-access-token')
      expect(result).toHaveProperty('refreshToken', 'mock-refresh-token')
      expect(result.user.email).toBe(registerData.email)
    })

    it('should throw ConflictError if user already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser())

      await expect(authService.register(registerData)).rejects.toThrow(
        'User with this email already exists'
      )
    })

    it('should hash password before saving', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)
      prismaMock.user.create.mockResolvedValue(
        createMockUser({ subscription: createMockSubscription() })
      )

      await authService.register(registerData)

      expect(bcrypt.hash).toHaveBeenCalledWith(registerData.password, 10)
    })
  })

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'Test@1234',
    }

    it('should login successfully with valid credentials', async () => {
      const mockUser = createMockUser({
        subscription: createMockSubscription(),
      })

      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await authService.login(loginData)

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(result.user.email).toBe(mockUser.email)
    })

    it('should throw AuthenticationError if user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      )
    })

    it('should throw AuthenticationError if password is wrong', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        createMockUser({ subscription: createMockSubscription() })
      )
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(authService.login(loginData)).rejects.toThrow(
        'Invalid email or password'
      )
    })
  })

  describe('refreshToken', () => {
    it('should return new access token for valid refresh token', async () => {
      const mockUser = createMockUser()
      ;(verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
      })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      ;(generateAccessToken as jest.Mock).mockReturnValue('new-access-token')

      const result = await authService.refreshToken('valid-refresh-token')

      expect(result).toHaveProperty('accessToken', 'new-access-token')
    })

    it('should throw AuthenticationError for invalid refresh token', async () => {
      ;(verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      )
    })

    it('should throw AuthenticationError if user no longer exists', async () => {
      ;(verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: 'deleted-user',
        email: 'deleted@example.com',
      })
      prismaMock.user.findUnique.mockResolvedValue(null)

      await expect(authService.refreshToken('valid-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      )
    })
  })

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = createMockUser({
        subscription: createMockSubscription(),
      })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      prismaMock.$queryRaw.mockResolvedValue([
        { transactionTimeRange: 'weekly', firstDayOfWeek: 0 },
      ])

      const result = await authService.getProfile('test-user-id')

      expect(result).toHaveProperty('email', mockUser.email)
      expect(result).toHaveProperty('name', mockUser.name)
      expect(result).toHaveProperty('subscription')
    })

    it('should throw NotFoundError if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      await expect(authService.getProfile('nonexistent-id')).rejects.toThrow(
        'User not found'
      )
    })
  })
})
