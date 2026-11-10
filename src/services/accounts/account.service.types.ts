import type { AccountType } from '../../domain/accounts/account.types'
import type { MoneyMinor } from '../../domain/money/money.types'

export interface UpdateAccountInput {
  name: string
  type: AccountType
  openingBalanceMinor?: MoneyMinor
}
