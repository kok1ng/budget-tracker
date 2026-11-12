import type { MoneyMinor } from '../../domain/money/money.types'

interface BaseTransactionInput {
  amountMinor: MoneyMinor
  description: string
  accountId: string
  date: string
}

export type CreateTransactionInput =
  | (BaseTransactionInput & {
      type: 'income' | 'expense'
      categoryId?: string | null
      destinationAccountId?: never
    })
  | (BaseTransactionInput & {
      type: 'transfer'
      destinationAccountId: string
      categoryId?: never
    })

export type UpdateTransactionInput = CreateTransactionInput

export interface TransactionServiceOptions {
  generateId: () => string
  getCurrentTimestamp: () => string
}
