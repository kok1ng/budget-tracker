import { describe, expect, it } from 'vitest'
import type { Account } from './account.types'
import type { Transaction } from '../transactions/transaction.types'
import {
  calculateAccountBalance,
  calculateTotalBalance,
} from './account.calculations'

const mainAccount: Account = {
  id: 'account-1',
  name: 'Main account',
  type: 'bank_account',
  currency: 'USD',
  openingBalanceMinor: 100000,
  createdAt: '2026-11-04T10:00:00.000Z',
  updatedAt: '2026-11-04T10:00:00.000Z',
  archivedAt: null
}

const savingsAccount: Account = {
  id: 'account-2',
  name: 'Savings account',
  type: 'savings',
  currency: 'USD',
  openingBalanceMinor: 200000,
  createdAt: '2026-11-04T10:00:00.000Z',
  updatedAt: '2026-11-04T10:00:00.000Z',
  archivedAt: null
}

const transactions: Transaction[] = [
  {
    id: 'transaction-1',
    type: 'income',
    amountMinor: 50000,
    currency: 'USD',
    description: 'Salary',
    categoryId: null,
    accountId: 'account-1',
    destinationAccountId: null,
    date: '2026-11-04',
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
  },
  {
    id: 'transaction-2',
    type: 'expense',
    amountMinor: 20000,
    currency: 'USD',
    description: 'Groceries',
    categoryId: 'category-1',
    accountId: 'account-1',
    destinationAccountId: null,
    date: '2026-11-04',
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
  },
  {
    id: 'transaction-3',
    type: 'transfer',
    amountMinor: 10000,
    currency: 'USD',
    description: 'Savings transfer',
    categoryId: null,
    accountId: 'account-1',
    destinationAccountId: 'account-2',
    date: '2026-11-04',
    createdAt: '2026-11-04T10:00:00.000Z',
    updatedAt: '2026-11-04T10:00:00.000Z',
  },
]

describe('calculateAccountBalance', () => {
  it('returns the opening balance when there are no transactions', () => {
    expect(calculateAccountBalance(mainAccount, [])).toBe(100000)
  })

  it('adds income to the account balance', () => {
    expect(
      calculateAccountBalance(mainAccount, [transactions[0]]),
    ).toBe(150000)
  })

  it('subtracts expenses from the account balance', () => {
    expect(
      calculateAccountBalance(mainAccount, [transactions[1]]),
    ).toBe(80000)
  })

  it('subtracts outgoing transfers from the source account', () => {
    expect(
      calculateAccountBalance(mainAccount, [transactions[2]]),
    ).toBe(90000)
  })

  it('adds incoming transfers to the destination account', () => {
    expect(
      calculateAccountBalance(savingsAccount, [transactions[2]]),
    ).toBe(210000)
  })

  it('calculates the balance using all transaction types', () => {
    expect(
      calculateAccountBalance(mainAccount, transactions),
    ).toBe(120000)
  })

  it('ignores transactions belonging to other accounts', () => {
    const unrelatedTransaction: Transaction = {
      ...transactions[0],
      id: 'transaction-4',
      accountId: 'account-999',
    }

    expect(
      calculateAccountBalance(mainAccount, [unrelatedTransaction]),
    ).toBe(100000)

    
  })

  it('throws when an account balance exceeds the safe integer limit', () => {
  const account = {
    ...mainAccount,
    openingBalanceMinor: Number.MAX_SAFE_INTEGER,
  }

  const income: Transaction = {
    ...transactions[0],
    amountMinor: 1,
  }

  expect(() => calculateAccountBalance(account, [income])).toThrow(
    'Account balance exceeds the safe integer limit',
  )
})
})

describe('calculateTotalBalance', () => {
  it('returns zero when there are no accounts', () => {
    expect(calculateTotalBalance([], transactions)).toBe(0)
  })

  it('returns the sum of all account balances', () => {
    expect(
      calculateTotalBalance(
        [mainAccount, savingsAccount],
        transactions,
      ),
    ).toBe(330000)
  })

  it('returns the sum of opening balances when there are no transactions', () => {
    expect(
      calculateTotalBalance(
        [mainAccount, savingsAccount],
        [],
      ),
    ).toBe(300000)
  })

  it('throws when the total balance exceeds the safe integer limit', () => {
  const account1 = {
    ...mainAccount,
    openingBalanceMinor: Number.MAX_SAFE_INTEGER,
  }

  const account2 = {
    ...savingsAccount,
    openingBalanceMinor: 1,
  }

  expect(() => calculateTotalBalance([account1, account2], [])).toThrow(
    'Account balance exceeds the safe integer limit',
  )
})
})