import type { MoneyMinor } from '../money/money.types'

export interface Budget {
  id: string
  categoryId: string
  year: number
  month: number
  limitMinor: MoneyMinor
  createdAt: string
  updatedAt: string
}
