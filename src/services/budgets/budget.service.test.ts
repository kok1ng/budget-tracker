import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Budget } from '../../domain/budgets/budget.types'
import type { Category } from '../../domain/categories/category.types'

import type { BudgetRepository } from '../storage/repositories/budgets/budget.repository'
import type { CategoryRepository } from '../storage/repositories/categories/category.repository'

import { BudgetService } from './budget.service'

const testCategory: Category = {
  id: 'category-1',
  name: 'Food',
  type: 'expense',
  createdAt: '2026-01-01T10:00:00.000Z',
  updatedAt: '2026-01-01T10:00:00.000Z',
}

const testBudget: Budget = {
  id: 'budget-1',
  categoryId: 'category-1',
  year: 2026,
  month: 2,
  limitMinor: 50000,
  createdAt: '2026-02-01T10:00:00.000Z',
  updatedAt: '2026-02-01T10:00:00.000Z',
}

describe('BudgetService', () => {
  let budgets: Budget[]
  let categories: Category[]

  let budgetRepository: BudgetRepository
  let categoryRepository: CategoryRepository
  let service: BudgetService

  beforeEach(() => {
    budgets = []
    categories = []

    budgetRepository = {
      getAll: vi.fn(async () => [...budgets]),
      getById: vi.fn(async (id: string) => budgets.find((budget) => budget.id === id) ?? null),
      save: vi.fn(async (budget: Budget) => {
        const index = budgets.findIndex((existing) => existing.id === budget.id)

        if (index === -1) {
          budgets.push(budget)
        } else {
          budgets[index] = budget
        }
      }),
      delete: vi.fn(async (id: string) => {
        budgets = budgets.filter((budget) => budget.id !== id)
      }),
    }

    categoryRepository = {
      getAll: vi.fn(async () => [...categories]),
      getById: vi.fn(
        async (id: string) => categories.find((category) => category.id === id) ?? null,
      ),
      save: vi.fn(),
      delete: vi.fn(),
    }

    service = new BudgetService(budgetRepository, categoryRepository, {
      generateId: () => 'budget-generated',
      getCurrentTimestamp: () => '2026-02-01T12:00:00.000Z',
    })
  })

  describe('getAllBudgets', () => {
    it('returns all budgets', async () => {
      budgets = [testBudget]

      await expect(service.getAllBudgets()).resolves.toEqual([testBudget])
    })
  })

  describe('getBudgetById', () => {
    it('returns a budget by its ID', async () => {
      budgets = [testBudget]

      await expect(service.getBudgetById('budget-1')).resolves.toEqual(testBudget)
    })

    it('returns null when the budget does not exist', async () => {
      await expect(service.getBudgetById('missing')).resolves.toBeNull()
    })
  })

  describe('createBudget', () => {
    it('creates and saves a budget', async () => {
      categories = [testCategory]

      const result = await service.createBudget({
        categoryId: 'category-1',
        year: 2026,
        month: 2,
        limitMinor: 75000,
      })

      expect(result).toEqual({
        id: 'budget-generated',
        categoryId: 'category-1',
        year: 2026,
        month: 2,
        limitMinor: 75000,
        createdAt: '2026-02-01T12:00:00.000Z',
        updatedAt: '2026-02-01T12:00:00.000Z',
      })

      expect(budgetRepository.save).toHaveBeenCalledWith(result)
    })

    it('rejects an empty category ID', async () => {
      await expect(
        service.createBudget({
          categoryId: ' ',
          year: 2026,
          month: 2,
          limitMinor: 50000,
        }),
      ).rejects.toMatchObject({
        name: 'BudgetOperationError',
        code: 'INVALID_BUDGET',
      })

      expect(categoryRepository.getById).not.toHaveBeenCalled()
      expect(budgetRepository.save).not.toHaveBeenCalled()
    })

    it('rejects a category that does not exist', async () => {
      await expect(
        service.createBudget({
          categoryId: 'missing',
          year: 2026,
          month: 2,
          limitMinor: 50000,
        }),
      ).rejects.toMatchObject({
        name: 'BudgetOperationError',
        code: 'CATEGORY_NOT_FOUND',
      })

      expect(budgetRepository.save).not.toHaveBeenCalled()
    })

    it('rejects an income category', async () => {
      categories = [{ ...testCategory, type: 'income' }]

      await expect(
        service.createBudget({
          categoryId: 'category-1',
          year: 2026,
          month: 2,
          limitMinor: 50000,
        }),
      ).rejects.toMatchObject({
        name: 'BudgetOperationError',
        code: 'CATEGORY_TYPE_MISMATCH',
      })

      expect(budgetRepository.save).not.toHaveBeenCalled()
    })

    it('rejects an invalid month', async () => {
      categories = [testCategory]

      await expect(
        service.createBudget({
          categoryId: 'category-1',
          year: 2026,
          month: 13,
          limitMinor: 50000,
        }),
      ).rejects.toMatchObject({
        name: 'BudgetOperationError',
        code: 'INVALID_BUDGET',
      })

      expect(budgetRepository.save).not.toHaveBeenCalled()
    })

    it('rejects a non-positive budget limit', async () => {
      categories = [testCategory]

      await expect(
        service.createBudget({
          categoryId: 'category-1',
          year: 2026,
          month: 2,
          limitMinor: 0,
        }),
      ).rejects.toMatchObject({
        name: 'BudgetOperationError',
        code: 'INVALID_BUDGET',
      })

      expect(budgetRepository.save).not.toHaveBeenCalled()
    })

    it('rejects a duplicate budget for the same category and month', async () => {
      categories = [testCategory]
      budgets = [testBudget]

      await expect(
        service.createBudget({
          categoryId: 'category-1',
          year: 2026,
          month: 2,
          limitMinor: 75000,
        }),
      ).rejects.toMatchObject({
        name: 'BudgetOperationError',
        code: 'BUDGET_ALREADY_EXISTS',
      })

      expect(budgetRepository.save).not.toHaveBeenCalled()
    })

    it('allows budgets for different months of the same category', async () => {
      categories = [testCategory]
      budgets = [testBudget]

      await expect(
        service.createBudget({
          categoryId: 'category-1',
          year: 2026,
          month: 3,
          limitMinor: 75000,
        }),
      ).resolves.toMatchObject({
        categoryId: 'category-1',
        year: 2026,
        month: 3,
      })

      expect(budgetRepository.save).toHaveBeenCalledOnce()
    })

    it('rejects a duplicate generated ID', async () => {
      categories = [
        testCategory,
        {
          ...testCategory,
          id: 'category-2',
          name: 'Transport',
        },
      ]
      budgets = [{ ...testBudget, id: 'budget-generated' }]

      await expect(
        service.createBudget({
          categoryId: 'category-2',
          year: 2026,
          month: 3,
          limitMinor: 75000,
        }),
      ).rejects.toMatchObject({
        code: 'INVALID_BUDGET',
      })

      expect(budgetRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('updateBudget', () => {
    it('updates and saves an existing budget', async () => {
      categories = [testCategory]
      budgets = [testBudget]

      const result = await service.updateBudget('budget-1', {
        limitMinor: 80000,
      })

      expect(result).toEqual({
        ...testBudget,
        limitMinor: 80000,
        updatedAt: '2026-02-01T12:00:00.000Z',
      })

      expect(budgetRepository.save).toHaveBeenCalledWith(result)
    })

    it('rejects updating a budget that does not exist', async () => {
      await expect(
        service.updateBudget('missing', {
          limitMinor: 80000,
        }),
      ).rejects.toMatchObject({
        name: 'BudgetOperationError',
        code: 'BUDGET_NOT_FOUND',
      })

      expect(budgetRepository.save).not.toHaveBeenCalled()
    })

    it('rejects updating a budget whose category no longer exists', async () => {
      budgets = [testBudget]

      await expect(
        service.updateBudget('budget-1', {
          limitMinor: 80000,
        }),
      ).rejects.toMatchObject({
        name: 'BudgetOperationError',
        code: 'CATEGORY_NOT_FOUND',
      })

      expect(budgetRepository.save).not.toHaveBeenCalled()
    })

    it('rejects updating a budget associated with an income category', async () => {
      categories = [{ ...testCategory, type: 'income' }]
      budgets = [testBudget]

      await expect(
        service.updateBudget('budget-1', {
          limitMinor: 80000,
        }),
      ).rejects.toMatchObject({
        name: 'BudgetOperationError',
        code: 'CATEGORY_TYPE_MISMATCH',
      })

      expect(budgetRepository.save).not.toHaveBeenCalled()
    })

    it('rejects a non-positive updated limit', async () => {
      categories = [testCategory]
      budgets = [testBudget]

      await expect(
        service.updateBudget('budget-1', {
          limitMinor: 0,
        }),
      ).rejects.toMatchObject({
        name: 'BudgetOperationError',
        code: 'INVALID_BUDGET',
      })

      expect(budgetRepository.save).not.toHaveBeenCalled()
    })
  })

  describe('deleteBudget', () => {
    it('deletes an existing budget', async () => {
      budgets = [testBudget]

      await expect(service.deleteBudget('budget-1')).resolves.toBeUndefined()

      expect(budgetRepository.delete).toHaveBeenCalledWith('budget-1')
      expect(budgets).toEqual([])
    })

    it('rejects deleting a budget that does not exist', async () => {
      await expect(service.deleteBudget('missing')).rejects.toMatchObject({
        name: 'BudgetOperationError',
        code: 'BUDGET_NOT_FOUND',
      })

      expect(budgetRepository.delete).not.toHaveBeenCalled()
    })
  })

  describe('repository errors', () => {
    it('propagates budget repository errors', async () => {
      const storageError = new Error('Storage is unavailable')

      vi.mocked(budgetRepository.getAll).mockRejectedValue(storageError)

      await expect(service.getAllBudgets()).rejects.toBe(storageError)
    })

    it('propagates category repository errors', async () => {
      const storageError = new Error('Storage is unavailable')

      vi.mocked(categoryRepository.getById).mockRejectedValue(storageError)

      await expect(
        service.createBudget({
          categoryId: 'category-1',
          year: 2026,
          month: 2,
          limitMinor: 50000,
        }),
      ).rejects.toBe(storageError)

      expect(budgetRepository.save).not.toHaveBeenCalled()
    })
  })
})
