import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Category } from '../../domain/categories/category.types'
import type { Transaction } from '../../domain/transactions/transaction.types'

import type { CategoryRepository } from '../storage/repositories/categories/category.repository'
import type { TransactionRepository } from '../storage/repositories/transactions/transaction.repository'

import { CategoryOperationError } from './category-operation.errors'
import { CategoryService } from './category.service'

const testCategory: Category = {
  id: 'category-1',
  name: 'Food',
  type: 'expense',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
}

const testTransaction = {
  categoryId: 'category-1',
} as Transaction

describe('CategoryService', () => {
  let categories: Category[]
  let transactions: Transaction[]

  let categoryRepository: CategoryRepository
  let transactionRepository: TransactionRepository
  let service: CategoryService

  beforeEach(() => {
    categories = []
    transactions = []

    categoryRepository = {
      getAll: vi.fn(async () => [...categories]),
      getById: vi.fn(
        async (id: string) => categories.find((category) => category.id === id) ?? null,
      ),
      save: vi.fn(async (category: Category) => {
        const index = categories.findIndex((existing) => existing.id === category.id)

        if (index === -1) {
          categories.push(category)
        } else {
          categories[index] = category
        }
      }),
      delete: vi.fn(async (id: string) => {
        categories = categories.filter((category) => category.id !== id)
      }),
    }

    transactionRepository = {
      getAll: vi.fn(async () => [...transactions]),
      getById: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }

    service = new CategoryService(categoryRepository, transactionRepository, {
      generateId: () => 'category-generated',
      getCurrentTimestamp: () => '2026-02-01T12:00:00.000Z',
    })
  })

  describe('getAllCategories', () => {
    it('returns all categories', async () => {
      categories = [testCategory]

      await expect(service.getAllCategories()).resolves.toEqual([testCategory])
    })
  })

  describe('getCategoryById', () => {
    it('returns a category by its ID', async () => {
      categories = [testCategory]

      await expect(service.getCategoryById('category-1')).resolves.toEqual(testCategory)
    })

    it('returns null when the category does not exist', async () => {
      await expect(service.getCategoryById('missing')).resolves.toBeNull()
    })
  })

  describe('createCategory', () => {
    it('creates and saves a category', async () => {
      const result = await service.createCategory({
        name: '  Groceries  ',
        type: 'expense',
      })

      expect(result).toEqual({
        id: 'category-generated',
        name: 'Groceries',
        type: 'expense',
        createdAt: '2026-02-01T12:00:00.000Z',
        updatedAt: '2026-02-01T12:00:00.000Z',
      })

      expect(categoryRepository.save).toHaveBeenCalledWith(result)
    })

    it('rejects an empty category name', async () => {
      await expect(service.createCategory({ name: '   ', type: 'expense' })).rejects.toMatchObject({
        name: 'CategoryOperationError',
        code: 'INVALID_CATEGORY',
      })
    })

    it('rejects a duplicate category name regardless of case', async () => {
      categories = [testCategory]

      await expect(service.createCategory({ name: 'food', type: 'income' })).rejects.toMatchObject({
        code: 'CATEGORY_NAME_ALREADY_EXISTS',
      })
    })

    it('rejects a duplicate generated ID', async () => {
      categories = [
        {
          ...testCategory,
          id: 'category-generated',
        },
      ]

      await expect(
        service.createCategory({ name: 'Transport', type: 'expense' }),
      ).rejects.toMatchObject({
        code: 'INVALID_CATEGORY',
      })
    })

    it('does not save a category when creation fails', async () => {
      categories = [testCategory]

      await expect(
        service.createCategory({ name: 'FOOD', type: 'expense' }),
      ).rejects.toBeInstanceOf(CategoryOperationError)

      expect(categoryRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('updateCategory', () => {
    it('updates and saves an existing category', async () => {
      categories = [testCategory]

      const result = await service.updateCategory('category-1', {
        name: '  Groceries  ',
        type: 'expense',
      })

      expect(result).toEqual({
        ...testCategory,
        name: 'Groceries',
        updatedAt: '2026-02-01T12:00:00.000Z',
      })

      expect(categoryRepository.save).toHaveBeenCalledWith(result)
    })

    it('rejects an empty category name', async () => {
      await expect(
        service.updateCategory('category-1', {
          name: ' ',
          type: 'expense',
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_CATEGORY',
      })
    })

    it('rejects updating a category that does not exist', async () => {
      await expect(
        service.updateCategory('missing', {
          name: 'Groceries',
          type: 'expense',
        }),
      ).rejects.toMatchObject({
        code: 'CATEGORY_NOT_FOUND',
      })
    })

    it('rejects a duplicate name belonging to another category', async () => {
      categories = [
        testCategory,
        {
          ...testCategory,
          id: 'category-2',
          name: 'Transport',
        },
      ]

      await expect(
        service.updateCategory('category-1', {
          name: ' transport ',
          type: 'expense',
        }),
      ).rejects.toMatchObject({
        code: 'CATEGORY_NAME_ALREADY_EXISTS',
      })
    })

    it('allows renaming a category that has transactions', async () => {
      categories = [testCategory]
      transactions = [testTransaction]

      await expect(
        service.updateCategory('category-1', {
          name: 'Groceries',
          type: 'expense',
        }),
      ).resolves.toMatchObject({
        name: 'Groceries',
      })

      expect(categoryRepository.save).toHaveBeenCalledOnce()
    })

    it('rejects changing the type when transactions reference the category', async () => {
      categories = [testCategory]
      transactions = [testTransaction]

      await expect(
        service.updateCategory('category-1', {
          name: 'Food',
          type: 'income',
        }),
      ).rejects.toMatchObject({
        name: 'CategoryOperationError',
        code: 'CATEGORY_TYPE_IN_USE',
      })

      expect(categoryRepository.save).not.toHaveBeenCalled()
    })

    it('allows changing the type when no transactions reference the category', async () => {
      categories = [testCategory]

      await expect(
        service.updateCategory('category-1', {
          name: 'Food',
          type: 'income',
        }),
      ).resolves.toMatchObject({
        type: 'income',
      })
    })
  })

  describe('deleteCategory', () => {
    it('deletes a category that has no transaction references', async () => {
      categories = [testCategory]

      await expect(service.deleteCategory('category-1')).resolves.toBeUndefined()

      expect(categoryRepository.delete).toHaveBeenCalledWith('category-1')
    })

    it('rejects deleting a category that does not exist', async () => {
      await expect(service.deleteCategory('missing')).rejects.toMatchObject({
        code: 'CATEGORY_NOT_FOUND',
      })
    })

    it('rejects deleting a category referenced by transactions', async () => {
      categories = [testCategory]
      transactions = [testTransaction]

      await expect(service.deleteCategory('category-1')).rejects.toMatchObject({
        name: 'CategoryOperationError',
        code: 'CATEGORY_HAS_TRANSACTIONS',
      })

      expect(categoryRepository.delete).not.toHaveBeenCalled()
    })
  })

  describe('repository errors', () => {
    it('propagates category repository errors', async () => {
      const storageError = new Error('Storage is unavailable')

      vi.mocked(categoryRepository.getAll).mockRejectedValue(storageError)

      await expect(service.getAllCategories()).rejects.toBe(storageError)
    })

    it('propagates transaction repository errors', async () => {
      const storageError = new Error('Storage is unavailable')

      categories = [testCategory]
      vi.mocked(transactionRepository.getAll).mockRejectedValue(storageError)

      await expect(service.deleteCategory('category-1')).rejects.toBe(storageError)
    })
  })
})
