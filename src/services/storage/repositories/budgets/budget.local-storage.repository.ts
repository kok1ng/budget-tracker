import type { Budget } from '../../../../domain/budgets/budget.types'
import { isValidBudget } from '../../../../domain/budgets/budget.validation'
import { readStorageCollection, writeStorageCollection } from '../../storage-collection.utils'
import type { BudgetRepository } from './budget.repository'

const BUDGET_STORAGE_KEY = 'budget-tracker:budgets'

export class LocalStorageBudgetRepository implements BudgetRepository {
  async getAll(): Promise<Budget[]> {
    return readStorageCollection(BUDGET_STORAGE_KEY, isValidBudget)
  }

  async getById(id: string): Promise<Budget | null> {
    const budgets = await this.getAll()
    return budgets.find((budget) => budget.id === id) ?? null
  }

  async save(budget: Budget): Promise<void> {
    const budgets = await this.getAll()
    const existingIndex = budgets.findIndex((existing) => existing.id === budget.id)

    if (existingIndex === -1) {
      budgets.push(budget)
    } else {
      budgets[existingIndex] = budget
    }

    writeStorageCollection(BUDGET_STORAGE_KEY, budgets, isValidBudget)
  }

  async delete(id: string): Promise<void> {
    const budgets = await this.getAll()
    const updatedBudgets = budgets.filter((budget) => budget.id !== id)

    writeStorageCollection(BUDGET_STORAGE_KEY, updatedBudgets, isValidBudget)
  }
}
