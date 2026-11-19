import { describe, expect, it } from 'vitest'
import type { Account } from '../accounts/account.types'
import type { Category } from '../categories/category.types'
import type { Transaction } from './transaction.types'
import { isTransactionContextValid } from './transaction.context.validation'

const accounts: Account[] = [
  {
    id: 'account-1',
    name: 'Main account',
    type: 'bank_account',
    currency: 'USD',
    openingBalanceMinor: 150000,
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
    archivedAt: null,
  },
  {
    id: 'account-2',
    name: 'Savings account',
    type: 'savings',
    currency: 'USD',
    openingBalanceMinor: 50000,
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
    archivedAt: null,
  },
]

const categories: Category[] = [
  {
    id: 'category-1',
    name: 'Groceries',
    type: 'expense',
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
  },
  {
    id: 'category-2',
    name: 'Salary',
    type: 'income',
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
  },
]

const validTransaction: Transaction = {
  id: 'transaction-1',
  type: 'expense',
  amountMinor: 2500,
  currency: 'USD',
  description: 'Groceries',
  categoryId: 'category-1',
  accountId: 'account-1',
  destinationAccountId: null,
  date: '2026-11-04',
  createdAt: '2026-11-04T10:00:00.000Z',
  updatedAt: '2026-11-04T10:00:00.000Z',
}

describe('isTransactionContextValid', () => {
  it('accepts a valid expense transaction', () => {
    expect(isTransactionContextValid(validTransaction, accounts, categories)).toBe(true)
  })

  it('accepts a valid income transaction', () => {
    expect(
      isTransactionContextValid(
        { ...validTransaction, type: 'income', categoryId: 'category-2' },
        accounts,
        categories,
      ),
    ).toBe(true)
  })

  it('accepts a valid transfer transaction', () => {
    expect(
      isTransactionContextValid(
        {
          ...validTransaction,
          type: 'transfer',
          categoryId: null,
          destinationAccountId: 'account-2',
        },
        accounts,
        categories,
      ),
    ).toBe(true)
  })

  it('rejects a transaction with a non-existent source account', () => {
    expect(
      isTransactionContextValid(
        { ...validTransaction, accountId: 'account-999' },
        accounts,
        categories,
      ),
    ).toBe(false)
  })

  it('rejects a transaction with a currency different from its source account', () => {
    expect(
      isTransactionContextValid({ ...validTransaction, currency: 'EUR' }, accounts, categories),
    ).toBe(false)
  })

  it('accepts a transaction without a category', () => {
    expect(
      isTransactionContextValid({ ...validTransaction, categoryId: null }, accounts, categories),
    ).toBe(true)
  })

  it('rejects a transaction with a non-existent category', () => {
    expect(
      isTransactionContextValid(
        { ...validTransaction, categoryId: 'category-999' },
        accounts,
        categories,
      ),
    ).toBe(false)
  })

  it('rejects an expense transaction with an income category', () => {
    expect(
      isTransactionContextValid(
        { ...validTransaction, categoryId: 'category-2' },
        accounts,
        categories,
      ),
    ).toBe(false)
  })

  it('rejects an income transaction with an expense category', () => {
    expect(
      isTransactionContextValid(
        { ...validTransaction, type: 'income', categoryId: 'category-1' },
        accounts,
        categories,
      ),
    ).toBe(false)
  })

  it('rejects a transfer with a category', () => {
    expect(
      isTransactionContextValid(
        {
          ...validTransaction,
          type: 'transfer',
          destinationAccountId: 'account-2',
        },
        accounts,
        categories,
      ),
    ).toBe(false)
  })

  it('rejects a transfer with a non-existent destination account', () => {
    expect(
      isTransactionContextValid(
        {
          ...validTransaction,
          type: 'transfer',
          categoryId: null,
          destinationAccountId: 'account-999',
        },
        accounts,
        categories,
      ),
    ).toBe(false)
  })

  it('rejects a transfer to the same account', () => {
    expect(
      isTransactionContextValid(
        {
          ...validTransaction,
          type: 'transfer',
          categoryId: null,
          destinationAccountId: 'account-1',
        },
        accounts,
        categories,
      ),
    ).toBe(false)
  })

  it('rejects a transfer with a different destination currency', () => {
    const euroAccounts: Account[] = [
      accounts[0],
      {
        ...accounts[1],
        currency: 'EUR',
      },
    ]

    expect(
      isTransactionContextValid(
        {
          ...validTransaction,
          type: 'transfer',
          categoryId: null,
          destinationAccountId: 'account-2',
        },
        euroAccounts,
        categories,
      ),
    ).toBe(false)
  })

  it('rejects a transaction with an archived source account', () => {
    const archivedAccounts: Account[] = [
      {
        ...accounts[0],
        archivedAt: '2026-11-04T12:00:00.000Z',
      },
      accounts[1],
    ]

    expect(isTransactionContextValid(validTransaction, archivedAccounts, categories)).toBe(false)
  })

  it('rejects a transfer to an archived destination account', () => {
    const archivedAccounts: Account[] = [
      accounts[0],
      {
        ...accounts[1],
        archivedAt: '2026-11-04T12:00:00.000Z',
      },
    ]

    expect(
      isTransactionContextValid(
        {
          ...validTransaction,
          type: 'transfer',
          categoryId: null,
          destinationAccountId: 'account-2',
        },
        archivedAccounts,
        categories,
      ),
    ).toBe(false)
  })
})
