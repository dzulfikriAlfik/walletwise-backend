/**
 * Unit tests for WalletService
 */

import '../setup'
import { prismaMock, resetAllMocks } from '../mocks/prisma.mock'
import { createMockUser, createMockWallet } from '../helpers'

import { WalletService } from '../../src/services/wallet.service'

describe('WalletService', () => {
  let walletService: WalletService

  beforeEach(() => {
    resetAllMocks()
    walletService = new WalletService()
  })

  describe('getAll', () => {
    it('should return all wallets for a user', async () => {
      const wallets = [
        createMockWallet({ id: 'wallet-1', name: 'Wallet 1' }),
        createMockWallet({ id: 'wallet-2', name: 'Wallet 2' }),
      ]
      prismaMock.wallet.findMany.mockResolvedValue(wallets)

      const result = await walletService.getAll('test-user-id')

      expect(result).toHaveLength(2)
      expect(prismaMock.wallet.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return empty array if user has no wallets', async () => {
      prismaMock.wallet.findMany.mockResolvedValue([])

      const result = await walletService.getAll('test-user-id')

      expect(result).toHaveLength(0)
    })
  })

  describe('getById', () => {
    it('should return a wallet by ID if it belongs to the user', async () => {
      const wallet = createMockWallet()
      prismaMock.wallet.findUnique.mockResolvedValue(wallet)

      const result = await walletService.getById('test-user-id', 'test-wallet-id')

      expect(result).toEqual(wallet)
    })

    it('should throw NotFoundError if wallet does not exist', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(null)

      await expect(
        walletService.getById('test-user-id', 'nonexistent-id')
      ).rejects.toThrow('Wallet not found')
    })

    it('should throw AuthorizationError if wallet belongs to another user', async () => {
      const wallet = createMockWallet({ userId: 'other-user-id' })
      prismaMock.wallet.findUnique.mockResolvedValue(wallet)

      await expect(
        walletService.getById('test-user-id', 'test-wallet-id')
      ).rejects.toThrow('You do not have access to this wallet')
    })
  })

  describe('create', () => {
    const createData = {
      name: 'Savings',
      balance: 500,
      currency: 'USD',
    }

    it('should create a wallet for a free user within wallet limit', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser())
      prismaMock.$queryRaw.mockResolvedValue([
        { tier: 'free', startDate: new Date(), endDate: null },
      ])
      prismaMock.wallet.count.mockResolvedValue(1) // Under limit of 3
      prismaMock.wallet.findUnique.mockResolvedValue(null) // No name conflict
      prismaMock.wallet.create.mockResolvedValue(
        createMockWallet({ name: createData.name, balance: createData.balance })
      )
      prismaMock.transaction.create.mockResolvedValue({})

      const result = await walletService.create('test-user-id', createData)

      expect(result.name).toBe(createData.name)
      expect(prismaMock.wallet.create).toHaveBeenCalled()
    })

    it('should create initial balance transaction if balance > 0', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser())
      prismaMock.$queryRaw.mockResolvedValue([
        { tier: 'free', startDate: new Date(), endDate: null },
      ])
      prismaMock.wallet.count.mockResolvedValue(0)
      prismaMock.wallet.findUnique.mockResolvedValue(null)
      prismaMock.wallet.create.mockResolvedValue(
        createMockWallet({ balance: 500 })
      )
      prismaMock.transaction.create.mockResolvedValue({})

      await walletService.create('test-user-id', createData)

      expect(prismaMock.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'income',
            category: 'other_income',
            amount: 500,
            description: 'Initial balance',
          }),
        })
      )
    })

    it('should throw error when free user reaches wallet limit', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser())
      prismaMock.$queryRaw.mockResolvedValue([
        { tier: 'free', startDate: new Date(), endDate: null },
      ])
      prismaMock.wallet.count.mockResolvedValue(3) // At limit

      await expect(
        walletService.create('test-user-id', createData)
      ).rejects.toThrow(/Wallet limit reached/)
    })

    it('should throw ConflictError if wallet name already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser())
      prismaMock.$queryRaw.mockResolvedValue([
        { tier: 'pro', startDate: new Date(), endDate: null },
      ])
      prismaMock.wallet.count.mockResolvedValue(0)
      prismaMock.wallet.findUnique.mockResolvedValue(createMockWallet()) // Name exists

      await expect(
        walletService.create('test-user-id', createData)
      ).rejects.toThrow('Wallet with this name already exists')
    })

    it('should throw NotFoundError if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      await expect(
        walletService.create('nonexistent-id', createData)
      ).rejects.toThrow('User not found')
    })
  })

  describe('delete', () => {
    it('should delete a wallet owned by the user', async () => {
      const wallet = createMockWallet()
      prismaMock.wallet.findUnique.mockResolvedValue(wallet)
      prismaMock.wallet.delete.mockResolvedValue(wallet)

      const result = await walletService.delete('test-user-id', 'test-wallet-id')

      expect(result).toEqual({ success: true, message: 'Wallet deleted successfully' })
      expect(prismaMock.wallet.delete).toHaveBeenCalledWith({
        where: { id: 'test-wallet-id' },
      })
    })
  })

  describe('getSummary', () => {
    it('should return wallet summary with total balance', async () => {
      const wallets = [
        { id: 'w1', name: 'Wallet 1', balance: 1000, currency: 'USD' },
        { id: 'w2', name: 'Wallet 2', balance: 500, currency: 'USD' },
      ]
      prismaMock.wallet.findMany.mockResolvedValue(wallets)

      const result = await walletService.getSummary('test-user-id')

      expect(result.totalBalance).toBe(1500)
      expect(result.totalWallets).toBe(2)
      expect(result.wallets).toHaveLength(2)
    })

    it('should return zero totals when user has no wallets', async () => {
      prismaMock.wallet.findMany.mockResolvedValue([])

      const result = await walletService.getSummary('test-user-id')

      expect(result.totalBalance).toBe(0)
      expect(result.totalWallets).toBe(0)
    })
  })
})
