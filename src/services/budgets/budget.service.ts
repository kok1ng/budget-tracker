import { isValidBudget } from '../../domain/budgets/budget.validation'
import type { Budget } from '../../domain/budgets/budget.types'
import type { CategoryRepository } from '../storage/repositories/categories/category.repository'
import type { BudgetRepository } from '../storage/repositories/budgets/budget.repository'

import { BudgetOperationError } from './budget-operation.errors'
import type {
  BudgetServiceOptions,
  CreateBudgetInput,
  UpdateBudgetInput,
} from './budget.service.types'

export class BudgetService {
  private readonly budgetRepository: BudgetRepository
  private readonly categoryRepository: CategoryRepository

  private readonly generateId: () => string
  private readonly getCurrentTimestamp: () => string

  constructor(
    budgetRepository: BudgetRepository,
    categoryRepository: CategoryRepository,
    options: Partial<BudgetServiceOptions> = {},
  ) {
    this.budgetRepository = budgetRepository
    this.categoryRepository = categoryRepository

    this.generateId = options.generateId ?? (() => crypto.randomUUID())
    this.getCurrentTimestamp = options.getCurrentTimestamp ?? (() => new Date().toISOString())
  }

  async getAllBudgets(): Promise<Budget[]> {
    return this.budgetRepository.getAll()
  }

  async getBudgetById(id: string): Promise<Budget | null> {
    return this.budgetRepository.getById(id)
  }

  async createBudget(input: CreateBudgetInput): Promise<Budget> {
    if (typeof input.categoryId !== 'string' || input.categoryId.trim().length === 0) {
      throw new BudgetOperationError('INVALID_BUDGET', 'Category ID cannot be empty.')
    }

    const category = await this.categoryRepository.getById(input.categoryId)

    if (category === null) {
      throw new BudgetOperationError('CATEGORY_NOT_FOUND', 'Category not found.')
    }

    if (category.type !== 'expense') {
      throw new BudgetOperationError(
        'CATEGORY_TYPE_MISMATCH',
        'Budgets can only be created for expense categories.',
      )
    }

    const timestamp = this.getCurrentTimestamp()

    const budget: Budget = {
      id: this.generateId(),
      categoryId: input.categoryId,
      year: input.year,
      month: input.month,
      limitMinor: input.limitMinor,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    if (!isValidBudget(budget)) {
      throw new BudgetOperationError('INVALID_BUDGET', 'The budget contains invalid data.')
    }

    const budgets = await this.budgetRepository.getAll()

    if (budgets.some((existing) => existing.id === budget.id)) {
      throw new BudgetOperationError('INVALID_BUDGET', 'The generated budget ID already exists.')
    }

    const duplicateBudget = budgets.some(
      (existing) =>
        existing.categoryId === budget.categoryId &&
        existing.year === budget.year &&
        existing.month === budget.month,
    )

    if (duplicateBudget) {
      throw new BudgetOperationError(
        'BUDGET_ALREADY_EXISTS',
        'A budget already exists for this category and month.',
      )
    }

    await this.budgetRepository.save(budget)

    return budget
  }

  async deleteBudget(id: string): Promise<void> {
    const existingBudget = await this.budgetRepository.getById(id)

    if (existingBudget === null) {
      throw new BudgetOperationError('BUDGET_NOT_FOUND', 'Budget not found.')
    }

    await this.budgetRepository.delete(id)
  }

  async updateBudget(id: string, input: UpdateBudgetInput): Promise<Budget> {
    const existingBudget = await this.budgetRepository.getById(id)

    if (existingBudget === null) {
      throw new BudgetOperationError('BUDGET_NOT_FOUND', 'Budget not found.')
    }

    const category = await this.categoryRepository.getById(existingBudget.categoryId)

    if (category === null) {
      throw new BudgetOperationError('CATEGORY_NOT_FOUND', 'Category not found.')
    }

    if (category.type !== 'expense') {
      throw new BudgetOperationError(
        'CATEGORY_TYPE_MISMATCH',
        'Budgets can only be associated with expense categories.',
      )
    }

    const updatedBudget: Budget = {
      ...existingBudget,
      limitMinor: input.limitMinor,
      updatedAt: this.getCurrentTimestamp(),
    }

    if (!isValidBudget(updatedBudget)) {
      throw new BudgetOperationError('INVALID_BUDGET', 'The budget contains invalid data.')
    }

    await this.budgetRepository.save(updatedBudget)

    return updatedBudget
  }
}
