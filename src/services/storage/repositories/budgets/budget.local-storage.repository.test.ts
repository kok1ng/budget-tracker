import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Budget } from '../../../../domain/budgets/budget.types'

import { readStorageCollection, writeStorageCollection } from '../../storage-collection.utils'
import { LocalStorageBudgetRepository } from './budget.local-storage.repository'

vi.mock('../../storage-collection.utils', () => ({
  readStorageCollection: vi.fn(),
  writeStorageCollection: vi.fn(),
}))

const testBudget: Budget = {
  id: 'budget-1',
  categoryId: 'category-1',
  year: 2026,
  month: 11,
  limitMinor: 50000,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
}

describe('LocalStorageBudgetRepository', () => {
  let repository: LocalStorageBudgetRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new LocalStorageBudgetRepository()
  })

  it('returns all stored budgets', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testBudget])

    await expect(repository.getAll()).resolves.toEqual([testBudget])

    expect(readStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:budgets',
      expect.any(Function),
    )
  })

  it('returns a budget by its ID', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testBudget])

    await expect(repository.getById('budget-1')).resolves.toEqual(testBudget)
  })

  it('returns null when a budget does not exist', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([])

    await expect(repository.getById('missing')).resolves.toBeNull()
  })

  it('adds a new budget', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([])

    await repository.save(testBudget)

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:budgets',
      [testBudget],
      expect.any(Function),
    )
  })

  it('updates an existing budget', async () => {
    const updatedBudget: Budget = {
      ...testBudget,
      limitMinor: 60000,
    }

    vi.mocked(readStorageCollection).mockReturnValue([testBudget])

    await repository.save(updatedBudget)

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:budgets',
      [updatedBudget],
      expect.any(Function),
    )
  })

  it('deletes a budget', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testBudget])

    await repository.delete('budget-1')

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:budgets',
      [],
      expect.any(Function),
    )
  })

  it('propagates storage errors when reading budgets', async () => {
    const storageError = new Error('Storage is unavailable')

    vi.mocked(readStorageCollection).mockImplementation(() => {
      throw storageError
    })

    await expect(repository.getAll()).rejects.toBe(storageError)
  })
})
