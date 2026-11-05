import { describe, expect, it } from 'vitest'
import type { Transaction } from './transaction.types'
import { isValidTransaction } from './transaction.validation'

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

describe('isValidTransaction', () => {
  it('accepts a valid expense transaction', () => {
    expect(isValidTransaction(validTransaction)).toBe(true)
  })

  it('accepts a valid income transaction', () => {
    expect(
      isValidTransaction({
        ...validTransaction,
        type: 'income',
      }),
    ).toBe(true)
  })

  it('accepts a valid transfer transaction', () => {
    expect(
      isValidTransaction({
        ...validTransaction,
        type: 'transfer',
        destinationAccountId: 'account-2',
      }),
    ).toBe(true)
  })

  it('accepts a transaction without a category', () => {
    expect(
      isValidTransaction({
        ...validTransaction,
        categoryId: null,
      }),
    ).toBe(true)
  })

  it('rejects null and non-object values', () => {
    expect(isValidTransaction(null)).toBe(false)
    expect(isValidTransaction(undefined)).toBe(false)
    expect(isValidTransaction('transaction')).toBe(false)
  })

  it('rejects an empty transaction ID', () => {
    expect(isValidTransaction({ ...validTransaction, id: '  ' })).toBe(false)
  })

  it('rejects unsupported transaction types', () => {
    expect(isValidTransaction({ ...validTransaction, type: 'refund' })).toBe(false)
  })

  it('rejects zero and negative amounts', () => {
    expect(isValidTransaction({ ...validTransaction, amountMinor: 0 })).toBe(false)

    expect(isValidTransaction({ ...validTransaction, amountMinor: -100 })).toBe(false)
  })

  it('rejects decimal amounts', () => {
    expect(isValidTransaction({ ...validTransaction, amountMinor: 100.5 })).toBe(false)
  })

  it('rejects unsupported currencies', () => {
    expect(isValidTransaction({ ...validTransaction, currency: 'GBP' })).toBe(false)
  })

  it('rejects empty descriptions', () => {
    expect(isValidTransaction({ ...validTransaction, description: '  ' })).toBe(false)
  })

  it('rejects empty category IDs', () => {
    expect(isValidTransaction({ ...validTransaction, categoryId: '  ' })).toBe(false)
  })

  it('rejects empty account IDs', () => {
    expect(isValidTransaction({ ...validTransaction, accountId: '  ' })).toBe(false)
  })

  it('rejects transfers without a destination account', () => {
    expect(
      isValidTransaction({
        ...validTransaction,
        type: 'transfer',
        destinationAccountId: null,
      }),
    ).toBe(false)
  })

  it('rejects transfers to the same account', () => {
    expect(
      isValidTransaction({
        ...validTransaction,
        type: 'transfer',
        destinationAccountId: 'account-1',
      }),
    ).toBe(false)
  })

  it('rejects income and expenses with a destination account', () => {
    expect(
      isValidTransaction({
        ...validTransaction,
        destinationAccountId: 'account-2',
      }),
    ).toBe(false)
  })

  it('rejects invalid calendar dates', () => {
    expect(isValidTransaction({ ...validTransaction, date: '2026-02-29' })).toBe(false)

    expect(isValidTransaction({ ...validTransaction, date: '2026-13-01' })).toBe(false)
  })

  it('rejects dates that do not use YYYY-MM-DD format', () => {
    expect(isValidTransaction({ ...validTransaction, date: '04-11-2026' })).toBe(false)
  })

  it('rejects invalid timestamps', () => {
    expect(
      isValidTransaction({
        ...validTransaction,
        createdAt: 'not-a-date',
      }),
    ).toBe(false)
  })

  it('rejects timestamps that are not in canonical UTC format', () => {
    expect(
      isValidTransaction({
        ...validTransaction,
        createdAt: '2026-11-04T10:00:00Z',
      }),
    ).toBe(false)
  })
})
