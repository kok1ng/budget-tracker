import { isValidCategory } from '../../domain/categories/category.validation'
import {
  createCategory as createCategoryOperation,
  deleteCategory as deleteCategoryOperation,
  updateCategory as updateCategoryOperation,
} from '../../domain/categories/category.operations'

import type { Category } from '../../domain/categories/category.types'

import type { CategoryRepository } from '../storage/repositories/categories/category.repository'
import type { TransactionRepository } from '../storage/repositories/transactions/transaction.repository'
import type { BudgetRepository } from '../storage/repositories/budgets/budget.repository'

import { CategoryOperationError } from './category-operation.errors'
import type {
  CategoryServiceOptions,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './category.service.types'

// Normalize names for case-insensitive duplicate checks.
function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase()
}

export class CategoryService {
  private readonly categoryRepository: CategoryRepository
  private readonly transactionRepository: TransactionRepository
  private readonly budgetRepository: BudgetRepository

  private readonly generateId: () => string
  private readonly getCurrentTimestamp: () => string

  constructor(
    categoryRepository: CategoryRepository,
    transactionRepository: TransactionRepository,
    budgetRepository: BudgetRepository,
    options: Partial<CategoryServiceOptions> = {},
  ) {
    this.categoryRepository = categoryRepository
    this.transactionRepository = transactionRepository
    this.budgetRepository = budgetRepository

    this.generateId = options.generateId ?? (() => crypto.randomUUID())
    this.getCurrentTimestamp = options.getCurrentTimestamp ?? (() => new Date().toISOString())
  }

  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.getAll()
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return this.categoryRepository.getById(id)
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      throw new CategoryOperationError('INVALID_CATEGORY', 'Category name cannot be empty.')
    }

    const timestamp = this.getCurrentTimestamp()

    const category: Category = {
      id: this.generateId(),
      name: input.name.trim(),
      type: input.type,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    const categories = await this.categoryRepository.getAll()

    if (!isValidCategory(category)) {
      throw new CategoryOperationError('INVALID_CATEGORY', 'The category contains invalid data.')
    }

    if (categories.some((existing) => existing.id === category.id)) {
      throw new CategoryOperationError(
        'INVALID_CATEGORY',
        'The generated category ID already exists.',
      )
    }

    const duplicateName = categories.some(
      (existing) => normalizeCategoryName(existing.name) === normalizeCategoryName(category.name),
    )

    if (duplicateName) {
      throw new CategoryOperationError(
        'CATEGORY_NAME_ALREADY_EXISTS',
        'A category with this name already exists.',
      )
    }

    createCategoryOperation(categories, category)

    await this.categoryRepository.save(category)

    return category
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      throw new CategoryOperationError('INVALID_CATEGORY', 'Category name cannot be empty.')
    }

    const categories = await this.categoryRepository.getAll()

    const existingCategory = categories.find((category) => category.id === id)

    if (existingCategory === undefined) {
      throw new CategoryOperationError('CATEGORY_NOT_FOUND', 'Category not found.')
    }

    const updatedCategory: Category = {
      ...existingCategory,
      name: input.name.trim(),
      type: input.type,
      updatedAt: this.getCurrentTimestamp(),
    }

    if (!isValidCategory(updatedCategory)) {
      throw new CategoryOperationError('INVALID_CATEGORY', 'The category contains invalid data.')
    }

    const duplicateName = categories.some(
      (category) =>
        category.id !== id &&
        normalizeCategoryName(category.name) === normalizeCategoryName(updatedCategory.name),
    )

    if (duplicateName) {
      throw new CategoryOperationError(
        'CATEGORY_NAME_ALREADY_EXISTS',
        'A category with this name already exists.',
      )
    }

    const transactions = await this.transactionRepository.getAll()

    const hasTransactions = transactions.some((transaction) => transaction.categoryId === id)

    if (updatedCategory.type !== existingCategory.type) {
      const budgets = await this.budgetRepository.getAll()
      const hasBudgets = budgets.some((budget) => budget.categoryId === id)

      if (hasTransactions || hasBudgets) {
        throw new CategoryOperationError(
          'CATEGORY_TYPE_IN_USE',
          'Cannot change the category type while transactions or budgets reference it.',
        )
      }
    }

    updateCategoryOperation(categories, updatedCategory, transactions)

    await this.categoryRepository.save(updatedCategory)

    return updatedCategory
  }

  async deleteCategory(id: string): Promise<void> {
    const categories = await this.categoryRepository.getAll()

    const categoryExists = categories.some((category) => category.id === id)

    if (!categoryExists) {
      throw new CategoryOperationError('CATEGORY_NOT_FOUND', 'Category not found.')
    }

    const transactions = await this.transactionRepository.getAll()

    const hasTransactions = transactions.some((transaction) => transaction.categoryId === id)

    if (hasTransactions) {
      throw new CategoryOperationError(
        'CATEGORY_HAS_TRANSACTIONS',
        'Cannot delete a category with existing transactions.',
      )
    }

    const budgets = await this.budgetRepository.getAll()

    const hasBudgets = budgets.some((budget) => budget.categoryId === id)

    if (hasBudgets) {
      throw new CategoryOperationError(
        'CATEGORY_HAS_BUDGETS',
        'Cannot delete a category with existing budgets.',
      )
    }

    deleteCategoryOperation(categories, id, transactions)

    await this.categoryRepository.delete(id)
  }
}
