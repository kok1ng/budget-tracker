import type { Budget } from '../../../../domain/budgets/budget.types'

export interface BudgetRepository {
  getAll(): Promise<Budget[]>
  getById(id: string): Promise<Budget | null>
  save(budget: Budget): Promise<void>
  delete(id: string): Promise<void>
}
