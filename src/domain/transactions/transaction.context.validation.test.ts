import { describe, expect, it } from 'vitest'
import type { Account } from '../accounts/account.types'
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
  },
  {
    id: 'account-2',
    name: 'Savings account',
    type: 'savings',
    currency: 'USD',
    openingBalanceMinor: 50000,
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

const categoryIds = ['category-1', 'category-2']

describe('isTransactionContextValid', () => {
  it('accepts a valid expense transaction', () => {
    expect(
      isTransactionContextValid(validTransaction, accounts, categoryIds),
    ).toBe(true)
  })

  it('accepts a valid income transaction', () => {
    expect(
      isTransactionContextValid(
        { ...validTransaction, type: 'income' },
        accounts,
        categoryIds,
      ),
    ).toBe(true)
  })

  it('accepts a valid transfer transaction', () => {
    expect(
      isTransactionContextValid(
        {
          ...validTransaction,
          type: 'transfer',
          destinationAccountId: 'account-2',
        },
        accounts,
        categoryIds,
      ),
    ).toBe(true)
  })

  it('rejects a transaction with a non-existent source account', () => {
    expect(
      isTransactionContextValid(
        { ...validTransaction, accountId: 'account-999' },
        accounts,
        categoryIds,
      ),
    ).toBe(false)
  })

  it('rejects a transaction with a currency different from its source account', () => {
    expect(
      isTransactionContextValid(
        { ...validTransaction, currency: 'EUR' },
        accounts,
        categoryIds,
      ),
    ).toBe(false)
  })

  it('accepts a transaction without a category', () => {
    expect(
      isTransactionContextValid(
        { ...validTransaction, categoryId: null },
        accounts,
        categoryIds,
      ),
    ).toBe(true)
  })

  it('rejects a transaction with a non-existent category', () => {
    expect(
      isTransactionContextValid(
        { ...validTransaction, categoryId: 'category-999' },
        accounts,
        categoryIds,
      ),
    ).toBe(false)
  })

  it('rejects a transfer with a non-existent destination account', () => {
    expect(
      isTransactionContextValid(
        {
          ...validTransaction,
          type: 'transfer',
          destinationAccountId: 'account-999',
        },
        accounts,
        categoryIds,
      ),
    ).toBe(false)
  })

  it('rejects a transfer to the same account', () => {
    expect(
      isTransactionContextValid(
        {
          ...validTransaction,
          type: 'transfer',
          destinationAccountId: 'account-1',
        },
        accounts,
        categoryIds,
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
          destinationAccountId: 'account-2',
        },
        euroAccounts,
        categoryIds,
      ),
    ).toBe(false)
  })
})