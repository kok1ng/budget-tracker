import type { Account } from '../../domain/accounts/account.types'
import {
  calculateAccountBalance,
  calculateTotalBalance,
} from '../../domain/accounts/account.calculations'
import type { CurrencyCode } from '../../domain/money/money.types'
import type { Transaction } from '../../domain/transactions/transaction.types'

export interface DashboardAccountBalance {
  account: Account
  balanceMinor: number
}

export interface DashboardData {
  currency: CurrencyCode | null
  totalBalanceMinor: number
  monthlyIncomeMinor: number
  monthlyExpensesMinor: number
  netCashFlowMinor: number
  recentTransactions: Transaction[]
  accountBalances: DashboardAccountBalance[]
}

export function calculateDashboardData(
  accounts: Account[],
  transactions: Transaction[],
  today: string,
): DashboardData {
  const activeAccounts = accounts.filter((account) => account.archivedAt === null)

  const firstDayOfMonth = `${today.slice(0, 7)}-01`

  const monthlyTransactions = transactions.filter(
    (transaction) => transaction.date >= firstDayOfMonth && transaction.date <= today,
  )

  const monthlyIncomeMinor = monthlyTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + transaction.amountMinor, 0)

  const monthlyExpensesMinor = monthlyTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + transaction.amountMinor, 0)

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const accountBalances = activeAccounts.map((account) => ({
    account,
    balanceMinor: calculateAccountBalance(account, transactions),
  }))

  return {
    currency: accounts[0]?.currency ?? null,
    totalBalanceMinor: calculateTotalBalance(activeAccounts, transactions),
    monthlyIncomeMinor,
    monthlyExpensesMinor,
    netCashFlowMinor: monthlyIncomeMinor - monthlyExpensesMinor,
    recentTransactions,
    accountBalances,
  }
}
