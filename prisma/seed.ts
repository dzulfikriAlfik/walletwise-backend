/**
 * Database seeder
 * Creates sample data for development
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg

async function main() {
  // Build connection string from env components
  const dbUser = process.env.DB_USER || 'dzulfikri'
  const dbPassword = process.env.DB_PASSWORD || ''
  const dbHost = process.env.DB_HOST || 'localhost'
  const dbPort = process.env.DB_PORT || '5432'
  const dbName = process.env.DB_NAME || 'walletwise_dev'
  
  const connectionString = `postgresql://${dbUser}${dbPassword ? ':' + dbPassword : ''}@${dbHost}:${dbPort}/${dbName}`
  
  const pool = new Pool({ connectionString })
  
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  console.log('🌱 Starting database seeding...')

  // Clear existing data (optional - comment out if you want to keep existing data)
  await prisma.transaction.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.user.deleteMany()

  // Hash password (using same method as registration)
  const password = 'Demo1234!'
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Create user with subscription
  const user = await prisma.user.create({
    data: {
      email: 'demo@walletwise.com',
      name: 'Demo User',
      password: hashedPassword,
      avatarUrl: null,
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

  console.log('✅ Created user:', user.email)

  // Create wallet
  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      name: 'Personal Wallet',
      balance: 1000,
      currency: 'USD',
      color: '#3B82F6',
      icon: '💰',
    },
  })

  console.log('✅ Created wallet:', wallet.name)

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      userId: user.id,
      walletId: wallet.id,
      type: 'income',
      category: 'salary',
      amount: 1000,
      description: 'Initial balance',
      date: new Date(),
    },
  })

  console.log('✅ Created transaction:', transaction.description)

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📋 Demo credentials:')
  console.log('   Email: demo@walletwise.com')
  console.log('   Password: Demo1234!')
  console.log('\n🚀 You can now login with these credentials!')

  await prisma.$disconnect()
  await pool.end()
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
