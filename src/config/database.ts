/**
 * Prisma database client
 * Single instance for entire application
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { env } from './env'

const { Pool } = pg

// Build connection string from components
const connectionString = `postgresql://${env.DB_USER}${env.DB_PASSWORD ? ':' + env.DB_PASSWORD : ''}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`

// Create a connection pool
const pool = new Pool({ connectionString })

// Create the Prisma Postgres adapter
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

export default prisma
