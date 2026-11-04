
import { describe, expect, it } from 'vitest'
import type { Account } from './account.types'
import type { Transaction } from '../transactions/transaction.types'
import {
  createAccount,
  updateAccount,
  deleteAccount,
  archiveAccount,
  restoreAccount,
  getAccountById,
  getAllAccounts
} from './account.operations'

const existingAccount: Account = {
  id: 'account-1',
  name: 'Main account',
  type: 'bank_account',
  currency: 'USD',
  openingBalanceMinor: 100000,
  createdAt: '2026-11-04T10:00:00.000Z',
  updatedAt: '2026-11-04T10:00:00.000Z',
  archivedAt: null
}

const newAccount: Account = {
  id: 'account-2',
  name: 'Savings account',
  type: 'savings',
  currency: 'USD',
  openingBalanceMinor: 50000,
  createdAt: '2026-11-04T11:00:00.000Z',
  updatedAt: '2026-11-04T11:00:00.000Z',
  archivedAt: null
}

const archivedAccount: Account = {
  ...existingAccount,
  archivedAt: '2026-11-04T12:00:00.000Z',
  updatedAt: '2026-11-04T12:00:00.000Z',
}

describe('createAccount', () => {
  it('creates a new account', () => {
    const result = createAccount([existingAccount], newAccount)

    expect(result).toHaveLength(2)
    expect(result[1]).toEqual(newAccount)
  })

  it('creates an account when the collection is empty', () => {
    const result = createAccount([], newAccount)

    expect(result).toEqual([newAccount])
  })

  it('rejects an invalid account', () => {
    const invalidAccount = {
      ...newAccount,
      name: '  ',
    }

    expect(() =>
      createAccount([existingAccount], invalidAccount),
    ).toThrow('Invalid account')
  })

  it('rejects an account with a duplicate ID', () => {
    const duplicateAccount = {
      ...newAccount,
      id: existingAccount.id,
    }

    expect(() =>
      createAccount([existingAccount], duplicateAccount),
    ).toThrow('Account with this ID already exists')
  })

  it('does not modify the original accounts array', () => {
    const accounts = [existingAccount]

    createAccount(accounts, newAccount)

    expect(accounts).toEqual([existingAccount])
    expect(accounts).toHaveLength(1)
  })

  it('does not modify the original account objects', () => {
    const accounts = [existingAccount]
    const originalAccount = { ...existingAccount }

    createAccount(accounts, newAccount)

    expect(accounts[0]).toEqual(originalAccount)
  })
})



describe('updateAccount', () => {
  it('updates an existing account', () => {
    const updatedAccount: Account = {
      ...existingAccount,
      name: 'Updated main account',
      updatedAt: '2026-11-04T12:00:00.000Z',
    }

    const result = updateAccount(
      [existingAccount],
      updatedAccount,
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(updatedAccount)
  })

  it('allows changing the opening balance to zero', () => {
    const updatedAccount: Account = {
      ...existingAccount,
      openingBalanceMinor: 0,
      updatedAt: '2026-11-04T12:00:00.000Z',
    }

    const result = updateAccount(
      [existingAccount],
      updatedAccount,
    )

    expect(result[0].openingBalanceMinor).toBe(0)
  })

  it('rejects updating an account that does not exist', () => {
    expect(() =>
      updateAccount([], existingAccount),
    ).toThrow('Account not found')
  })

  it('rejects an invalid updated account', () => {
    const invalidAccount: Account = {
      ...existingAccount,
      name: '  ',
      updatedAt: '2026-11-04T12:00:00.000Z',
    }

    expect(() =>
      updateAccount([existingAccount], invalidAccount),
    ).toThrow('Invalid account')
  })

  it('does not allow changing the creation date', () => {
    const updatedAccount: Account = {
      ...existingAccount,
      createdAt: '2026-11-04T11:00:00.000Z',
      updatedAt: '2026-11-04T12:00:00.000Z',
    }

    expect(() =>
      updateAccount([existingAccount], updatedAccount),
    ).toThrow('Account creation date cannot be changed')
  })

  it('does not modify the original accounts array', () => {
    const accounts = [existingAccount]
    const updatedAccount: Account = {
      ...existingAccount,
      name: 'Updated main account',
      updatedAt: '2026-11-04T12:00:00.000Z',
    }

    const result = updateAccount(accounts, updatedAccount)

    expect(accounts[0]).toEqual(existingAccount)
    expect(result).not.toBe(accounts)
  })

  it('does not modify other accounts', () => {
    const accounts = [existingAccount, newAccount]

    const updatedAccount: Account = {
      ...existingAccount,
      name: 'Updated main account',
      updatedAt: '2026-11-04T12:00:00.000Z',
    }

    const result = updateAccount(accounts, updatedAccount)

    expect(result[1]).toBe(newAccount)
    expect(result[1]).toEqual(newAccount)
  })

  it('should reject changing the archive status directly', () => {
  const updatedAccount: Account = {
    ...existingAccount,
    archivedAt: '2026-11-04T12:00:00.000Z',
    updatedAt: '2026-11-04T12:00:00.000Z',
  }

  expect(() =>
    updateAccount([existingAccount], updatedAccount),
  ).toThrow('Account archive status cannot be changed directly')
})

it('should reject restoring an account through updateAccount', () => {
  const updatedAccount: Account = {
    ...archivedAccount,
    archivedAt: null,
    updatedAt: '2026-11-05T12:00:00.000Z',
  }

  expect(() =>
    updateAccount([archivedAccount], updatedAccount),
  ).toThrow('Account archive status cannot be changed directly')
})
})



const existingTransaction: Transaction = {
  id: 'transaction-1',
  type: 'expense',
  amountMinor: 1500,
  currency: 'USD',
  description: 'Groceries',
  categoryId: null,
  accountId: 'account-1',
  destinationAccountId: null,
  date: '2026-11-04T12:00:00.000Z',
  createdAt: '2026-11-04T12:00:00.000Z',
  updatedAt: '2026-11-04T12:00:00.000Z',
}

const transferTransaction: Transaction = {
  id: 'transaction-2',
  type: 'transfer',
  amountMinor: 5000,
  currency: 'USD',
  description: 'Transfer to savings',
  categoryId: null,
  accountId: 'account-1',
  destinationAccountId: 'account-2',
  date: '2026-11-04T13:00:00.000Z',
  createdAt: '2026-11-04T13:00:00.000Z',
  updatedAt: '2026-11-04T13:00:00.000Z',
}



describe('deleteAccount', () => {
  it('deletes an account without transactions', () => {
    const accounts = [existingAccount, newAccount]

    const result = deleteAccount(
      accounts,
      'account-2',
      [],
    )

    expect(result).toEqual([existingAccount])
    expect(result).toHaveLength(1)
  })

  it('rejects deleting an account that does not exist', () => {
    expect(() =>
      deleteAccount([], 'unknown-account', []),
    ).toThrow('Account not found')
  })

  it('rejects deleting an account with outgoing transactions', () => {
    expect(() =>
      deleteAccount(
        [existingAccount],
        'account-1',
        [existingTransaction],
      ),
    ).toThrow('Cannot delete an account with transactions')
  })

  it('rejects deleting an account used as a transfer destination', () => {
    expect(() =>
      deleteAccount(
        [newAccount],
        'account-2',
        [transferTransaction],
      ),
    ).toThrow('Cannot delete an account with transactions')
  })

  it('does not modify the original accounts array', () => {
    const accounts = [existingAccount, newAccount]

    const result = deleteAccount(
      accounts,
      'account-2',
      [],
    )

    expect(accounts).toHaveLength(2)
    expect(result).not.toBe(accounts)
  })

  it('does not modify the transaction history', () => {
  const accounts = [existingAccount, newAccount]
  const transactions = [existingTransaction]
  const originalTransactions = [...transactions]

  deleteAccount(
    accounts,
    'account-2',
    transactions,
  )

  expect(transactions).toEqual(originalTransactions)
})
})


describe('archiveAccount', () => {
  it('should archive an active account', () => {
    const result = archiveAccount(
      [existingAccount],
      'account-1',
      '2026-11-04T12:00:00.000Z',
    )

    expect(result[0].archivedAt).toBe('2026-11-04T12:00:00.000Z')
    expect(result[0].updatedAt).toBe('2026-11-04T12:00:00.000Z')
  })

  it('should throw an error if the account does not exist', () => {
    expect(() =>
      archiveAccount([], 'account-1', '2026-11-04T12:00:00.000Z'),
    ).toThrow('Account not found')
  })

  it('should throw an error if the account is already archived', () => {
    expect(() =>
      archiveAccount(
        [archivedAccount],
        'account-1',
        '2026-11-05T12:00:00.000Z',
      ),
    ).toThrow('Account is already archived')
  })

  it('should throw an error if the archive timestamp is invalid', () => {
    expect(() =>
      archiveAccount([existingAccount], 'account-1', 'invalid-date'),
    ).toThrow('Invalid archive timestamp')
  })

  it('should not mutate the original accounts array', () => {
    const accounts = [existingAccount]

    const result = archiveAccount(
      accounts,
      'account-1',
      '2026-11-04T12:00:00.000Z',
    )

    expect(accounts[0].archivedAt).toBeNull()
    expect(result).not.toBe(accounts)
  })

  it('should preserve other accounts', () => {
    const accounts = [existingAccount, newAccount]

    const result = archiveAccount(
      accounts,
      'account-1',
      '2026-11-04T12:00:00.000Z',
    )

    expect(result[1]).toBe(newAccount)
  })
})


describe('restoreAccount', () => {
  it('should restore an archived account', () => {
    const result = restoreAccount(
      [archivedAccount],
      'account-1',
      '2026-11-05T12:00:00.000Z',
    )

    expect(result[0].archivedAt).toBeNull()
    expect(result[0].updatedAt).toBe('2026-11-05T12:00:00.000Z')
  })

  it('should throw an error if the account does not exist', () => {
    expect(() =>
      restoreAccount([], 'account-1', '2026-11-05T12:00:00.000Z'),
    ).toThrow('Account not found')
  })

  it('should throw an error if the account is not archived', () => {
    expect(() =>
      restoreAccount(
        [existingAccount],
        'account-1',
        '2026-11-05T12:00:00.000Z',
      ),
    ).toThrow('Account is not archived')
  })

  it('should throw an error if the update timestamp is invalid', () => {
    expect(() =>
      restoreAccount([archivedAccount], 'account-1', 'invalid-date'),
    ).toThrow('Invalid update timestamp')
  })

  it('should not mutate the original accounts array', () => {
    const accounts = [archivedAccount]

    const result = restoreAccount(
      accounts,
      'account-1',
      '2026-11-05T12:00:00.000Z',
    )

    expect(accounts[0].archivedAt).toBe('2026-11-04T12:00:00.000Z')
    expect(result).not.toBe(accounts)
  })
})

describe('getAccountById', () => {
  it('should return an account with the specified ID', () => {
    const result = getAccountById(
      [existingAccount, newAccount],
      'account-1',
    )

    expect(result).toEqual(existingAccount)
  })

  it('should return undefined if the account does not exist', () => {
    const result = getAccountById([], 'account-999')

    expect(result).toBeUndefined()
  })

  it('should return an archived account', () => {
    const result = getAccountById(
      [archivedAccount],
      'account-1',
    )

    expect(result).toEqual(archivedAccount)
  })
})

describe('getAllAccounts', () => {
  it('should return all accounts', () => {
    const result = getAllAccounts([existingAccount, newAccount])

    expect(result).toEqual([existingAccount, newAccount])
  })

  it('should return an empty array if there are no accounts', () => {
    expect(getAllAccounts([])).toEqual([])
  })

  it('should include archived accounts', () => {
    const result = getAllAccounts([existingAccount, archivedAccount])

    expect(result).toEqual([existingAccount, archivedAccount])
  })

  it('should return a new array without mutating the original', () => {
    const accounts = [existingAccount, newAccount]

    const result = getAllAccounts(accounts)

    expect(result).not.toBe(accounts)
    expect(result).toEqual(accounts)
  })
})
