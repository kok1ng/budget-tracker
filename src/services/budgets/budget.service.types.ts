import type { MoneyMinor } from '../../domain/money/money.types'

export interface CreateBudgetInput {
  categoryId: string
  year: number
  month: number
  limitMinor: MoneyMinor
}

export interface UpdateBudgetInput {
  limitMinor: MoneyMinor
}

export interface BudgetServiceOptions {
  generateId: () => string
  getCurrentTimestamp: () => string
}
