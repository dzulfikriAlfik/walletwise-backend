/**
 * Prisma database client
 * Single instance for entire application
 * Prisma 7 requires driver adapter (PrismaPg)
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { env } from './env.js'
import { logger } from '../utils/logger.js'

const { Pool } = pg
const pool = new Pool({ connectionString: env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Redact password from connection URL for safe logging
 */
function sanitizeDbUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.password) {
      // parsed.password = '****'
    }
    return parsed.toString()
  } catch {
    return '(invalid url)'
  }
}

/**
 * Connect to database and log success/failure
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect()
    const dbUrl = sanitizeDbUrl(env.DATABASE_URL)
    logger.info('Database connected', { url: dbUrl, env: env.NODE_ENV })
  } catch (err) {
    logger.error('Database connection failed', { error: err instanceof Error ? err.message : String(err) })
    throw err
  }
}

export default prisma
