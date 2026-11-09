import type { MoneyMinor } from '../../domain/money/money.types'

export interface CreateTransactionInput {
  type: 'income' | 'expense'
  amountMinor: MoneyMinor
  description: string
  categoryId?: string | null
  accountId: string
  date: string
}

export type UpdateTransactionInput = CreateTransactionInput

export interface TransactionServiceOptions {
  generateId: () => string
  getCurrentTimestamp: () => string
}
