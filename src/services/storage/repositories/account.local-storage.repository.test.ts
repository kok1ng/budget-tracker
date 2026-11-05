import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readStorageCollection, writeStorageCollection } from '../storage-collection.utils'
import { LocalStorageAccountRepository } from './account.local-storage.repository'
import type { Account } from '../../../domain/accounts/account.types'

vi.mock('../storage-collection.utils', () => ({
  readStorageCollection: vi.fn(),
  writeStorageCollection: vi.fn(),
}))

const testAccount: Account = {
  id: 'account-1',
  name: 'Main debit card',
  type: 'debit_card',
  currency: 'USD',
  openingBalanceMinor: 150000,
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
  archivedAt: null,
}

describe('LocalStorageAccountRepository', () => {
  let repository: LocalStorageAccountRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new LocalStorageAccountRepository()
  })

  it('returns all stored accounts', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testAccount])

    await expect(repository.getAll()).resolves.toEqual([testAccount])

    expect(readStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:accounts',
      expect.any(Function),
    )
  })

  it('returns an account by its ID', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testAccount])

    await expect(repository.getById('account-1')).resolves.toEqual(testAccount)
  })

  it('returns null when an account does not exist', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([])

    await expect(repository.getById('missing')).resolves.toBeNull()
  })

  it('adds a new account', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([])

    await repository.save(testAccount)

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:accounts',
      [testAccount],
      expect.any(Function),
    )
  })

  it('updates an existing account', async () => {
    const updatedAccount: Account = {
      ...testAccount,
      name: 'Updated debit card',
    }

    vi.mocked(readStorageCollection).mockReturnValue([testAccount])

    await repository.save(updatedAccount)

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:accounts',
      [updatedAccount],
      expect.any(Function),
    )
  })

  it('deletes an account', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testAccount])

    await repository.delete('account-1')

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:accounts',
      [],
      expect.any(Function),
    )
  })

  it('propagates storage errors when reading accounts', async () => {
    const storageError = new Error('Storage is unavailable')

    vi.mocked(readStorageCollection).mockImplementation(() => {
      throw storageError
    })

    await expect(repository.getAll()).rejects.toBe(storageError)
  })
})
