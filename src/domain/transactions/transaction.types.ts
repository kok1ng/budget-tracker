import type { CurrencyCode, MoneyMinor } from '../money/money.types'

export type TransactionType = 'income' | 'expense' | 'transfer'

export interface Transaction {
  id: string
  type: TransactionType
  amountMinor: MoneyMinor
  currency: CurrencyCode
  description: string
  categoryId: string | null
  accountId: string
  destinationAccountId: string | null
  date: string
  createdAt: string
  updatedAt: string
}