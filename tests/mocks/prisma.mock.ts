/**
 * Prisma mock for unit tests
 * Provides a mock PrismaClient with all model methods
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
interface AnyMock {
  (...args: any[]): any
  mockResolvedValue: (val: any) => AnyMock
  mockResolvedValueOnce: (val: any) => AnyMock
  mockRejectedValue: (val: any) => AnyMock
  mockReturnValue: (val: any) => AnyMock
  mockImplementation: (fn: any) => AnyMock
  mockReset: () => void
  mockClear: () => void
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const fn = (): AnyMock => jest.fn() as unknown as AnyMock

export const prismaMock = {
  user: {
    findUnique: fn(),
    findMany: fn(),
    create: fn(),
    update: fn(),
    delete: fn(),
    count: fn(),
  },
  subscription: {
    findUnique: fn(),
    create: fn(),
    update: fn(),
    upsert: fn(),
  },
  wallet: {
    findUnique: fn(),
    findMany: fn(),
    create: fn(),
    update: fn(),
    delete: fn(),
    count: fn(),
  },
  transaction: {
    findUnique: fn(),
    findMany: fn(),
    create: fn(),
    update: fn(),
    delete: fn(),
  },
  category: {
    findUnique: fn(),
    findFirst: fn(),
    findMany: fn(),
    create: fn(),
    update: fn(),
    delete: fn(),
  },
  payment: {
    findUnique: fn(),
    findFirst: fn(),
    findMany: fn(),
    create: fn(),
    update: fn(),
  },
  $queryRaw: fn(),
  $executeRaw: fn(),
  $transaction: fn(),
  $connect: fn(),
  $disconnect: fn(),
}

// Mock the database module
jest.mock('../../src/config/database', () => ({
  prisma: prismaMock,
  connectDatabase: jest.fn(),
}))

// Mock the logger to silence output during tests
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock payment gateways to prevent real API calls
jest.mock('../../src/gateways/stripe.gateway', () => ({
  createStripeCheckout: jest.fn(),
}))

jest.mock('../../src/gateways/xendit.gateway', () => ({
  createXenditInvoice: jest.fn(),
}))

export function resetAllMocks() {
  Object.values(prismaMock).forEach((model) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((fn) => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
          ;(fn as unknown as AnyMock).mockReset()
        }
      })
    } else if (typeof model === 'function' && 'mockReset' in model) {
      ;(model as unknown as AnyMock).mockReset()
    }
  })
}
