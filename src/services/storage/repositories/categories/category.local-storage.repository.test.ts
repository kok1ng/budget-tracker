import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readStorageCollection, writeStorageCollection } from '../../storage-collection.utils'
import { LocalStorageCategoryRepository } from './category.local-storage.repository'
import type { Category } from '../../../../domain/categories/category.types'

vi.mock('../../storage-collection.utils', () => ({
  readStorageCollection: vi.fn(),
  writeStorageCollection: vi.fn(),
}))

const testCategory: Category = {
  id: 'category-1',
  name: 'Food',
  type: 'expense',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
}

describe('LocalStorageCategoryRepository', () => {
  let repository: LocalStorageCategoryRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new LocalStorageCategoryRepository()
  })

  it('returns all stored categories', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testCategory])

    await expect(repository.getAll()).resolves.toEqual([testCategory])

    expect(readStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:categories',
      expect.any(Function),
    )
  })

  it('returns a category by its ID', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testCategory])

    await expect(repository.getById('category-1')).resolves.toEqual(testCategory)
  })

  it('returns null when a category does not exist', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([])

    await expect(repository.getById('missing')).resolves.toBeNull()
  })

  it('adds a new category', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([])

    await repository.save(testCategory)

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:categories',
      [testCategory],
      expect.any(Function),
    )
  })

  it('updates an existing category', async () => {
    const updatedCategory: Category = {
      ...testCategory,
      name: 'Groceries',
    }

    vi.mocked(readStorageCollection).mockReturnValue([testCategory])

    await repository.save(updatedCategory)

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:categories',
      [updatedCategory],
      expect.any(Function),
    )
  })

  it('deletes a category', async () => {
    vi.mocked(readStorageCollection).mockReturnValue([testCategory])

    await repository.delete('category-1')

    expect(writeStorageCollection).toHaveBeenCalledWith(
      'budget-tracker:categories',
      [],
      expect.any(Function),
    )
  })

  it('propagates storage errors when reading categories', async () => {
    const storageError = new Error('Storage is unavailable')

    vi.mocked(readStorageCollection).mockImplementation(() => {
      throw storageError
    })

    await expect(repository.getAll()).rejects.toBe(storageError)
  })
})
