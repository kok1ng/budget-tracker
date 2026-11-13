import { describe, expect, it } from 'vitest'
import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import { calculateDashboardData } from './dashboard.calculations'

const mainAccount: Account = {
  id: 'account-1',
  name: 'Main account',
  type: 'bank_account',
  currency: 'USD',
  openingBalanceMinor: 100000,
  createdAt: '2026-11-04T10:00:00.000Z',
  updatedAt: '2026-11-04T10:00:00.000Z',
  archivedAt: null,
}

const savingsAccount: Account = {
  id: 'account-2',
  name: 'Savings account',
  type: 'savings',
  currency: 'USD',
  openingBalanceMinor: 200000,
  createdAt: '2026-11-04T10:00:00.000Z',
  updatedAt: '2026-11-04T10:00:00.000Z',
  archivedAt: null,
}

const archivedAccount: Account = {
  ...savingsAccount,
  id: 'account-3',
  name: 'Archived account',
  archivedAt: '2026-11-10T10:00:00.000Z',
}

function createTransaction(
  overrides: Partial<Transaction> & Pick<Transaction, 'id' | 'date'>,
): Transaction {
  return {
    type: 'income',
    amountMinor: 10000,
    currency: 'USD',
    description: 'Test transaction',
    categoryId: null,
    accountId: mainAccount.id,
    destinationAccountId: null,
    createdAt: `${overrides.date}T10:00:00.000Z`,
    updatedAt: `${overrides.date}T10:00:00.000Z`,
    ...overrides,
  }
}

describe('calculateDashboardData', () => {
  it('calculates total balance using active accounts only', () => {
    const income = createTransaction({
      id: 'transaction-1',
      date: '2026-11-13',
      amountMinor: 50000,
    })

    const archivedIncome = createTransaction({
      id: 'transaction-2',
      date: '2026-11-13',
      accountId: archivedAccount.id,
      amountMinor: 30000,
    })

    const result = calculateDashboardData(
      [mainAccount, archivedAccount],
      [income, archivedIncome],
      '2026-11-13',
    )

    expect(result.totalBalanceMinor).toBe(150000)
    expect(result.accountBalances).toEqual([
      {
        account: mainAccount,
        balanceMinor: 150000,
      },
    ])
  })

  it('calculates monthly income and expenses from the first day through today', () => {
    const transactions = [
      createTransaction({
        id: 'first-day-income',
        date: '2026-11-01',
        amountMinor: 50000,
      }),
      createTransaction({
        id: 'today-expense',
        date: '2026-11-13',
        type: 'expense',
        amountMinor: 20000,
      }),
      createTransaction({
        id: 'previous-month-income',
        date: '2026-10-31',
        amountMinor: 100000,
      }),
      createTransaction({
        id: 'future-expense',
        date: '2026-11-14',
        type: 'expense',
        amountMinor: 40000,
      }),
    ]

    const result = calculateDashboardData([mainAccount], transactions, '2026-11-13')

    expect(result.monthlyIncomeMinor).toBe(50000)
    expect(result.monthlyExpensesMinor).toBe(20000)
    expect(result.netCashFlowMinor).toBe(30000)
  })

  it('includes monthly transactions from archived accounts', () => {
    const archivedExpense = createTransaction({
      id: 'archived-expense',
      date: '2026-11-12',
      type: 'expense',
      accountId: archivedAccount.id,
      amountMinor: 15000,
    })

    const result = calculateDashboardData(
      [mainAccount, archivedAccount],
      [archivedExpense],
      '2026-11-13',
    )

    expect(result.monthlyExpensesMinor).toBe(15000)
    expect(result.totalBalanceMinor).toBe(100000)
  })

  it('excludes transfers from income and expenses', () => {
    const transfer = createTransaction({
      id: 'transfer-1',
      date: '2026-11-13',
      type: 'transfer',
      amountMinor: 25000,
      destinationAccountId: savingsAccount.id,
    })

    const result = calculateDashboardData([mainAccount, savingsAccount], [transfer], '2026-11-13')

    expect(result.monthlyIncomeMinor).toBe(0)
    expect(result.monthlyExpensesMinor).toBe(0)
    expect(result.netCashFlowMinor).toBe(0)
    expect(result.recentTransactions).toEqual([transfer])
  })

  it('returns the five most recent transactions in descending date order', () => {
    const transactions = [
      createTransaction({ id: 'transaction-1', date: '2026-11-01' }),
      createTransaction({ id: 'transaction-2', date: '2026-11-05' }),
      createTransaction({ id: 'transaction-3', date: '2026-11-03' }),
      createTransaction({ id: 'transaction-4', date: '2026-11-10' }),
      createTransaction({ id: 'transaction-5', date: '2026-11-07' }),
      createTransaction({ id: 'transaction-6', date: '2026-11-12' }),
      createTransaction({ id: 'transaction-7', date: '2026-11-09' }),
    ]

    const result = calculateDashboardData([mainAccount], transactions, '2026-11-13')

    expect(result.recentTransactions.map((transaction) => transaction.id)).toEqual([
      'transaction-6',
      'transaction-4',
      'transaction-7',
      'transaction-5',
      'transaction-2',
    ])

    // Sorting must not change the original transactions array.
    expect(transactions.map((transaction) => transaction.id)).toEqual([
      'transaction-1',
      'transaction-2',
      'transaction-3',
      'transaction-4',
      'transaction-5',
      'transaction-6',
      'transaction-7',
    ])
  })

  it('returns zero totals and empty collections when there are no accounts or transactions', () => {
    const result = calculateDashboardData([], [], '2026-11-13')

    expect(result.currency).toBeNull()
    expect(result.totalBalanceMinor).toBe(0)
    expect(result.monthlyIncomeMinor).toBe(0)
    expect(result.monthlyExpensesMinor).toBe(0)
    expect(result.netCashFlowMinor).toBe(0)
    expect(result.recentTransactions).toEqual([])
    expect(result.accountBalances).toEqual([])
  })

  it('uses the established currency even when only archived accounts remain', () => {
    const result = calculateDashboardData([archivedAccount], [], '2026-11-13')

    expect(result.currency).toBe('USD')
    expect(result.totalBalanceMinor).toBe(0)
    expect(result.accountBalances).toEqual([])
  })
})
