/**
 * Authentication Service
 * Business logic for user authentication and registration
 */

import bcrypt from 'bcryptjs'
import { prisma } from '@/config/database'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt'
import { AuthenticationError, ConflictError, NotFoundError } from '@/utils/errors'
import type { RegisterInput, LoginInput } from '@/schemas/auth.schemas'

interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    avatarUrl: string | null
    subscription: {
      tier: string
      isActive: boolean
    }
  }
  accessToken: string
  refreshToken: string
}

interface UserProfile {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  subscription: {
    tier: string
    isActive: boolean
    startDate: Date
    endDate: Date | null
  }
  createdAt: Date
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new ConflictError('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user with default free subscription
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        subscription: {
          create: {
            tier: 'free',
            isActive: true,
          },
        },
      },
      include: {
        subscription: true,
      },
    })

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        subscription: {
          tier: user.subscription!.tier,
          isActive: user.subscription!.isActive,
        },
      },
      accessToken,
      refreshToken,
    }
  }

  /**
   * Login user
   */
  async login(data: LoginInput): Promise<AuthResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      throw new AuthenticationError('Invalid email or password')
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password)

    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password')
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    })

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        subscription: {
          tier: user.subscription?.tier || 'free',
          isActive: user.subscription?.isActive || false,
        },
      },
      accessToken,
      refreshToken,
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken)

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      })

      if (!user) {
        throw new AuthenticationError('User not found')
      }

      // Generate new access token
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
      })

      return { accessToken }
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token')
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      subscription: {
        tier: user.subscription?.tier || 'free',
        isActive: user.subscription?.isActive || false,
        startDate: user.subscription?.startDate || user.createdAt,
        endDate: user.subscription?.endDate || null,
        trialEndDate: user.subscription?.trialEndDate || null,
      },
      createdAt: user.createdAt,
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: { name?: string; avatarUrl?: string }
  ): Promise<UserProfile> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      },
      include: {
        subscription: true,
      },
    })

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      subscription: {
        tier: user.subscription?.tier || 'free',
        isActive: user.subscription?.isActive || false,
        startDate: user.subscription?.startDate || user.createdAt,
        endDate: user.subscription?.endDate || null,
        trialEndDate: user.subscription?.trialEndDate || null,
      },
      createdAt: user.createdAt,
    }
  }
}

export const authService = new AuthService()
