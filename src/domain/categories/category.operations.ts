import type { Category } from './category.types'
import { isValidCategory } from './category.validation'
import type { Transaction } from '../transactions/transaction.types'

// Normalize category names for case-insensitive uniqueness checks.
function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase()
}

// Create a new category and add it to the categories array.
export function createCategory(categories: Category[], newCategory: Category): Category[] {
  if (!isValidCategory(newCategory)) {
    throw new Error('Invalid category')
  }

  const categoryExists = categories.some((category) => category.id === newCategory.id)

  if (categoryExists) {
    throw new Error('Category with this ID already exists')
  }

  const duplicateName = categories.some(
    (category) => normalizeCategoryName(category.name) === normalizeCategoryName(newCategory.name),
  )

  if (duplicateName) {
    throw new Error('Category with this name already exists')
  }

  return [...categories, newCategory]
}

// Update an existing category in the categories array.
export function updateCategory(
  categories: Category[],
  updatedCategory: Category,
  transactions: Transaction[],
): Category[] {
  const existingCategory = categories.find((category) => category.id === updatedCategory.id)

  if (!existingCategory) {
    throw new Error('Category not found')
  }

  if (updatedCategory.createdAt !== existingCategory.createdAt) {
    throw new Error('Category creation date cannot be changed')
  }

  if (!isValidCategory(updatedCategory)) {
    throw new Error('Invalid category')
  }

  const duplicateName = categories.some(
    (category) =>
      category.id !== updatedCategory.id &&
      normalizeCategoryName(category.name) === normalizeCategoryName(updatedCategory.name),
  )

  if (duplicateName) {
    throw new Error('Category with this name already exists')
  }

  const hasTransactions = transactions.some(
    (transaction) => transaction.categoryId === existingCategory.id,
  )

  if (updatedCategory.type !== existingCategory.type && hasTransactions) {
    throw new Error('Cannot change category type while transactions reference it')
  }

  return categories.map((category) =>
    category.id === updatedCategory.id ? updatedCategory : category,
  )
}

// Delete an existing category if no transactions reference it.
export function deleteCategory(
  categories: Category[],
  categoryId: string,
  transactions: Transaction[],
): Category[] {
  const categoryExists = categories.some((category) => category.id === categoryId)

  if (!categoryExists) {
    throw new Error('Category not found')
  }

  const hasTransactions = transactions.some((transaction) => transaction.categoryId === categoryId)

  if (hasTransactions) {
    throw new Error('Cannot delete a category with transactions')
  }

  return categories.filter((category) => category.id !== categoryId)
}

// Find a category by ID. Return undefined if it does not exist.
export function getCategoryById(categories: Category[], categoryId: string): Category | undefined {
  return categories.find((category) => category.id === categoryId)
}

// Return a new array containing all categories.
export function getAllCategories(categories: Category[]): Category[] {
  return [...categories]
}
