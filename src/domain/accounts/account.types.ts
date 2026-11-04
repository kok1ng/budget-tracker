import type { CurrencyCode, MoneyMinor } from '../money/money.types'

export type AccountType =
  | 'cash'
  | 'debit_card'
  | 'bank_account'
  | 'savings'

export interface Account {
  id: string
  name: string
  type: AccountType
  currency: CurrencyCode
  openingBalanceMinor: MoneyMinor
  createdAt: string
  updatedAt: string
}