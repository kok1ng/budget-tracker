import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readStorageCollection, writeStorageCollection } from '../storage-collection.utils'
import { LocalStorageTransactionRepository } from './transaction.local-storage.repository'
import type { Transaction } from '../../../domain/transactions/transaction.types'

vi.mock('../storage-collection.utils', () => ({
  readStorageCollection: vi.fn(),
  writeStorageCollection: vi.fn(),
}))

const testTransaction: Transaction = {
  id: 'transaction-1',
  type: 'expense',
  amountMinor: 2500,
  currency: 'USD',
  description: 'Groceries',
  categoryId: null,
  accountId: 'account-1',
  destinationAccountId: null,
  date: '2026-11-05',
  createdAt: '2026-11-05T10:00:00.000Z',
  updatedAt: '2026-11-05T10:00:00.000Z',
}

describe('LocalStorageTransactionRepository', () => {
  let repository: LocalStorageTransactionRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new LocalStorageTransactionRepository()
  })

  it('returns all stored transactions', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testTransaction])

    await expect(repository.getAll()).resolves.toEqual([testTransaction])

    expect(readStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:transactions',
      expect.any(Function),
    )
  })

  it('returns a transaction by its ID', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testTransaction])

    await expect(repository.getById('transaction-1')).resolves.toEqual(testTransaction)
  })

  it('returns null when a transaction does not exist', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([])

    await expect(repository.getById('missing')).resolves.toBeNull()
  })

  it('adds a new transaction', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([])

    await repository.save(testTransaction)

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:transactions',
      [testTransaction],
      expect.any(Function),
    )
  })

  it('updates an existing transaction', async () => {
    const updatedTransaction: Transaction = {
      ...testTransaction,
      description: 'Updated groceries',
    }

    vi.mocked(readStorageCollection).mockReturnValue([testTransaction])

    await repository.save(updatedTransaction)

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:transactions',
      [updatedTransaction],
      expect.any(Function),
    )
  })

  it('deletes a transaction', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testTransaction])

    await repository.delete('transaction-1')

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:transactions',
      [],
      expect.any(Function),
    )
  })
})
