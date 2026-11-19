import { describe, expect, it } from 'vitest'
import type { Category } from './category.types'
import type { Transaction } from '../transactions/transaction.types'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
  getAllCategories,
} from './category.operations'

const existingCategory: Category = {
  id: 'category-1',
  name: 'Food',
  type: 'expense',
  createdAt: '2026-11-19T10:00:00.000Z',
  updatedAt: '2026-11-19T10:00:00.000Z',
}

const newCategory: Category = {
  id: 'category-2',
  name: 'Salary',
  type: 'income',
  createdAt: '2026-11-19T11:00:00.000Z',
  updatedAt: '2026-11-19T11:00:00.000Z',
}

const existingTransaction: Transaction = {
  id: 'transaction-1',
  type: 'expense',
  amountMinor: 1500,
  currency: 'USD',
  description: 'Groceries',
  categoryId: 'category-1',
  accountId: 'account-1',
  destinationAccountId: null,
  date: '2026-11-19T12:00:00.000Z',
  createdAt: '2026-11-19T12:00:00.000Z',
  updatedAt: '2026-11-19T12:00:00.000Z',
}

describe('createCategory', () => {
  it('creates a new category', () => {
    const result = createCategory([existingCategory], newCategory)

    expect(result).toEqual([existingCategory, newCategory])
  })

  it('creates a category when the collection is empty', () => {
    expect(createCategory([], newCategory)).toEqual([newCategory])
  })

  it('rejects an invalid category', () => {
    const invalidCategory = {
      ...newCategory,
      name: '  ',
    }

    expect(() => createCategory([], invalidCategory)).toThrow('Invalid category')
  })

  it('rejects a duplicate ID', () => {
    const duplicateCategory = {
      ...newCategory,
      id: existingCategory.id,
    }

    expect(() => createCategory([existingCategory], duplicateCategory)).toThrow(
      'Category with this ID already exists',
    )
  })

  it('rejects a duplicate name regardless of capitalization', () => {
    const duplicateCategory = {
      ...newCategory,
      name: 'food',
    }

    expect(() => createCategory([existingCategory], duplicateCategory)).toThrow(
      'Category with this name already exists',
    )
  })

  it('rejects a duplicate name with surrounding whitespace', () => {
    const duplicateCategory = {
      ...newCategory,
      name: ' Food ',
    }

    expect(() => createCategory([existingCategory], duplicateCategory)).toThrow(
      'Category with this name already exists',
    )
  })

  it('does not modify the original categories array', () => {
    const categories = [existingCategory]

    const result = createCategory(categories, newCategory)

    expect(categories).toEqual([existingCategory])
    expect(result).not.toBe(categories)
  })
})

describe('updateCategory', () => {
  it('updates an existing category', () => {
    const updatedCategory: Category = {
      ...existingCategory,
      name: 'Groceries',
      updatedAt: '2026-11-19T12:00:00.000Z',
    }

    expect(updateCategory([existingCategory], updatedCategory, [])).toEqual([updatedCategory])
  })

  it('allows renaming a category referenced by transactions', () => {
    const updatedCategory: Category = {
      ...existingCategory,
      name: 'Groceries',
      updatedAt: '2026-11-19T12:00:00.000Z',
    }

    expect(updateCategory([existingCategory], updatedCategory, [existingTransaction])).toEqual([
      updatedCategory,
    ])
  })

  it('rejects updating a category that does not exist', () => {
    expect(() => updateCategory([], existingCategory, [])).toThrow('Category not found')
  })

  it('rejects an invalid updated category', () => {
    const invalidCategory: Category = {
      ...existingCategory,
      name: '  ',
      updatedAt: '2026-11-19T12:00:00.000Z',
    }

    expect(() => updateCategory([existingCategory], invalidCategory, [])).toThrow(
      'Invalid category',
    )
  })

  it('does not allow changing the creation date', () => {
    const updatedCategory: Category = {
      ...existingCategory,
      createdAt: '2026-11-19T11:00:00.000Z',
      updatedAt: '2026-11-19T12:00:00.000Z',
    }

    expect(() => updateCategory([existingCategory], updatedCategory, [])).toThrow(
      'Category creation date cannot be changed',
    )
  })

  it('rejects a duplicate name regardless of capitalization', () => {
    const updatedCategory: Category = {
      ...newCategory,
      name: 'food',
    }

    expect(() => updateCategory([existingCategory, newCategory], updatedCategory, [])).toThrow(
      'Category with this name already exists',
    )
  })

  it('rejects changing the category type when transactions reference it', () => {
    const updatedCategory: Category = {
      ...existingCategory,
      type: 'income',
      updatedAt: '2026-11-19T12:00:00.000Z',
    }

    expect(() =>
      updateCategory([existingCategory], updatedCategory, [existingTransaction]),
    ).toThrow('Cannot change category type while transactions reference it')
  })

  it('allows changing the category type when no transactions reference it', () => {
    const updatedCategory: Category = {
      ...existingCategory,
      type: 'income',
      updatedAt: '2026-11-19T12:00:00.000Z',
    }

    expect(updateCategory([existingCategory], updatedCategory, [])).toEqual([updatedCategory])
  })

  it('does not modify the original categories array', () => {
    const categories = [existingCategory]
    const updatedCategory: Category = {
      ...existingCategory,
      name: 'Groceries',
      updatedAt: '2026-11-19T12:00:00.000Z',
    }

    const result = updateCategory(categories, updatedCategory, [])

    expect(categories[0]).toEqual(existingCategory)
    expect(result).not.toBe(categories)
  })

  it('does not modify the transaction history', () => {
    const transactions = [existingTransaction]
    const originalTransactions = [...transactions]
    const updatedCategory: Category = {
      ...existingCategory,
      name: 'Groceries',
      updatedAt: '2026-11-19T12:00:00.000Z',
    }

    updateCategory([existingCategory], updatedCategory, transactions)

    expect(transactions).toEqual(originalTransactions)
  })
})

describe('deleteCategory', () => {
  it('deletes a category without transactions', () => {
    const result = deleteCategory([existingCategory, newCategory], 'category-2', [])

    expect(result).toEqual([existingCategory])
  })

  it('rejects deleting a category that does not exist', () => {
    expect(() => deleteCategory([], 'unknown-category', [])).toThrow('Category not found')
  })

  it('rejects deleting a category referenced by transactions', () => {
    expect(() => deleteCategory([existingCategory], 'category-1', [existingTransaction])).toThrow(
      'Cannot delete a category with transactions',
    )
  })

  it('does not modify the original categories array', () => {
    const categories = [existingCategory, newCategory]

    const result = deleteCategory(categories, 'category-2', [])

    expect(categories).toHaveLength(2)
    expect(result).not.toBe(categories)
  })

  it('does not modify the transaction history', () => {
    const transactions = [existingTransaction]
    const originalTransactions = [...transactions]

    deleteCategory([existingCategory], 'category-1', [])

    expect(transactions).toEqual(originalTransactions)
  })
})

describe('getCategoryById', () => {
  it('returns the category with the specified ID', () => {
    expect(getCategoryById([existingCategory, newCategory], 'category-1')).toEqual(existingCategory)
  })

  it('returns undefined when the category does not exist', () => {
    expect(getCategoryById([], 'unknown-category')).toBeUndefined()
  })
})

describe('getAllCategories', () => {
  it('returns all categories', () => {
    expect(getAllCategories([existingCategory, newCategory])).toEqual([
      existingCategory,
      newCategory,
    ])
  })

  it('returns an empty array when there are no categories', () => {
    expect(getAllCategories([])).toEqual([])
  })

  it('returns a new array without modifying the original', () => {
    const categories = [existingCategory, newCategory]

    const result = getAllCategories(categories)

    expect(result).not.toBe(categories)
    expect(result).toEqual(categories)
  })
})
