import { describe, expect, it } from 'vitest'
import type { Budget } from './budget.types'
import type { Transaction } from '../transactions/transaction.types'
import { calculateBudgetProgress, calculateBudgetSpent } from './budget.calculations'

const budget: Budget = {
  id: 'budget-1',
  categoryId: 'category-groceries',
  year: 2026,
  month: 11,
  limitMinor: 50000,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
}

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'transaction-1',
  type: 'expense',
  amountMinor: 10000,
  currency: 'USD',
  description: 'Groceries',
  categoryId: 'category-groceries',
  accountId: 'account-1',
  destinationAccountId: null,
  date: '2026-11-15',
  createdAt: '2026-11-15T10:00:00.000Z',
  updatedAt: '2026-11-15T10:00:00.000Z',
  ...overrides,
})

describe('calculateBudgetSpent', () => {
  it('returns zero when there are no transactions', () => {
    expect(calculateBudgetSpent(budget, [])).toBe(0)
  })

  it('sums matching expense transactions', () => {
    const transactions = [
      createTransaction({ id: 'transaction-1', amountMinor: 10000 }),
      createTransaction({ id: 'transaction-2', amountMinor: 15000 }),
      createTransaction({ id: 'transaction-3', amountMinor: 5000 }),
    ]

    expect(calculateBudgetSpent(budget, transactions)).toBe(30000)
  })

  it('includes expenses on the first and last day of the budget month', () => {
    const transactions = [
      createTransaction({ id: 'transaction-1', date: '2026-11-01' }),
      createTransaction({ id: 'transaction-2', date: '2026-11-30' }),
    ]

    expect(calculateBudgetSpent(budget, transactions)).toBe(20000)
  })

  it('excludes transactions from other months and years', () => {
    const transactions = [
      createTransaction({ id: 'transaction-1', date: '2026-10-31' }),
      createTransaction({ id: 'transaction-2', date: '2026-12-01' }),
      createTransaction({ id: 'transaction-3', date: '2025-11-15' }),
      createTransaction({ id: 'transaction-4', date: '2027-11-15' }),
    ]

    expect(calculateBudgetSpent(budget, transactions)).toBe(0)
  })

  it('excludes transactions belonging to other categories', () => {
    const transactions = [
      createTransaction({ categoryId: 'category-transport' }),
      createTransaction({ categoryId: 'category-entertainment' }),
    ]

    expect(calculateBudgetSpent(budget, transactions)).toBe(0)
  })

  it('excludes income transactions', () => {
    const transaction = createTransaction({
      type: 'income',
    })

    expect(calculateBudgetSpent(budget, [transaction])).toBe(0)
  })

  it('excludes transfer transactions', () => {
    const transaction = createTransaction({
      type: 'transfer',
      categoryId: null,
      destinationAccountId: 'account-2',
    })

    expect(calculateBudgetSpent(budget, [transaction])).toBe(0)
  })

  it('excludes uncategorized expenses', () => {
    const transaction = createTransaction({
      categoryId: null,
    })

    expect(calculateBudgetSpent(budget, [transaction])).toBe(0)
  })

  it('supports months with a single-digit month number', () => {
    const januaryBudget = {
      ...budget,
      month: 1,
    }

    const transactions = [
      createTransaction({ date: '2026-01-15' }),
      createTransaction({ date: '2026-11-15' }),
    ]

    expect(calculateBudgetSpent(januaryBudget, transactions)).toBe(10000)
  })

  it('throws when total spending exceeds the safe integer limit', () => {
    const transactions = [
      createTransaction({
        id: 'transaction-1',
        amountMinor: Number.MAX_SAFE_INTEGER,
      }),
      createTransaction({
        id: 'transaction-2',
        amountMinor: 1,
      }),
    ]

    expect(() => calculateBudgetSpent(budget, transactions)).toThrow(
      'Budget spending exceeds the safe integer limit',
    )
  })
})

describe('calculateBudgetProgress', () => {
  it('calculates progress when spending is below the budget limit', () => {
    const transactions = [
      createTransaction({ amountMinor: 20000 }),
      createTransaction({ id: 'transaction-2', amountMinor: 10000 }),
    ]

    expect(calculateBudgetProgress(budget, transactions)).toEqual({
      spentMinor: 30000,
      remainingMinor: 20000,
      usagePercentage: 60,
      isOverspent: false,
    })
  })

  it('calculates progress when spending exactly reaches the budget limit', () => {
    const transactions = [
      createTransaction({ amountMinor: 30000 }),
      createTransaction({ id: 'transaction-2', amountMinor: 20000 }),
    ]

    expect(calculateBudgetProgress(budget, transactions)).toEqual({
      spentMinor: 50000,
      remainingMinor: 0,
      usagePercentage: 100,
      isOverspent: false,
    })
  })

  it('calculates progress when spending exceeds the budget limit', () => {
    const transactions = [
      createTransaction({ amountMinor: 50000 }),
      createTransaction({ id: 'transaction-2', amountMinor: 7000 }),
    ]

    expect(calculateBudgetProgress(budget, transactions)).toEqual({
      spentMinor: 57000,
      remainingMinor: -7000,
      usagePercentage: 114,
      isOverspent: true,
    })
  })

  it('returns zero progress when there is no spending', () => {
    expect(calculateBudgetProgress(budget, [])).toEqual({
      spentMinor: 0,
      remainingMinor: 50000,
      usagePercentage: 0,
      isOverspent: false,
    })
  })
})
