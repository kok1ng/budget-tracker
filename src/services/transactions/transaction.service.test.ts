import { beforeEach, describe, expect, it } from 'vitest'
import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import type { AccountRepository } from '../storage/repositories/account.repository'
import type { TransactionRepository } from '../storage/repositories/transaction.repository'
import { TransactionService } from './transaction.service'

const testAccount: Account = {
  id: 'account-1',
  name: 'Main account',
  type: 'bank_account',
  currency: 'USD',
  openingBalanceMinor: 100000,
  createdAt: '2026-11-06T10:00:00.000Z',
  updatedAt: '2026-11-06T10:00:00.000Z',
  archivedAt: null,
}

const existingTransaction: Transaction = {
  id: 'transaction-existing',
  type: 'expense',
  amountMinor: 20000,
  currency: 'USD',
  description: 'Groceries',
  categoryId: null,
  accountId: 'account-1',
  destinationAccountId: null,
  date: '2026-11-06',
  createdAt: '2026-11-06T10:00:00.000Z',
  updatedAt: '2026-11-06T10:00:00.000Z',
}

let accounts: Account[]
let transactions: Transaction[]

let accountRepository: AccountRepository
let transactionRepository: TransactionRepository
let service: TransactionService

beforeEach(() => {
  accounts = [{ ...testAccount }]
  transactions = [{ ...existingTransaction }]

  accountRepository = {
    getAll: async () => accounts,
    getById: async (id) => accounts.find((account) => account.id === id) ?? null,
    save: async (account) => {
      const index = accounts.findIndex((existing) => existing.id === account.id)

      if (index === -1) {
        accounts.push(account)
      } else {
        accounts[index] = account
      }
    },
    delete: async (id) => {
      accounts = accounts.filter((account) => account.id !== id)
    },
  }

  transactionRepository = {
    getAll: async () => transactions,
    getById: async (id) => transactions.find((transaction) => transaction.id === id) ?? null,
    save: async (transaction) => {
      const index = transactions.findIndex((existing) => existing.id === transaction.id)

      if (index === -1) {
        transactions.push(transaction)
      } else {
        transactions[index] = transaction
      }
    },
    delete: async (id) => {
      transactions = transactions.filter((transaction) => transaction.id !== id)
    },
  }

  service = new TransactionService(accountRepository, transactionRepository, {
    generateId: () => 'transaction-new',
    getCurrentTimestamp: () => '2026-11-06T12:00:00.000Z',
  })
})

describe('createTransaction', () => {
  it('creates an income transaction and saves it', async () => {
    const result = await service.createTransaction({
      type: 'income',
      amountMinor: 50000,
      description: 'Monthly salary',
      accountId: 'account-1',
      date: '2026-11-06',
    })

    expect(result).toEqual({
      id: 'transaction-new',
      type: 'income',
      amountMinor: 50000,
      currency: 'USD',
      description: 'Monthly salary',
      categoryId: null,
      accountId: 'account-1',
      destinationAccountId: null,
      date: '2026-11-06',
      createdAt: '2026-11-06T12:00:00.000Z',
      updatedAt: '2026-11-06T12:00:00.000Z',
    })

    expect(transactions).toHaveLength(2)
    expect(transactions[1]).toEqual(result)
  })

  it('creates an expense transaction and saves it', async () => {
    const result = await service.createTransaction({
      type: 'expense',
      amountMinor: 30000,
      description: 'Rent',
      categoryId: 'category-1',
      accountId: 'account-1',
      date: '2026-11-06',
    })

    expect(result).toEqual({
      id: 'transaction-new',
      type: 'expense',
      amountMinor: 30000,
      currency: 'USD',
      description: 'Rent',
      categoryId: 'category-1',
      accountId: 'account-1',
      destinationAccountId: null,
      date: '2026-11-06',
      createdAt: '2026-11-06T12:00:00.000Z',
      updatedAt: '2026-11-06T12:00:00.000Z',
    })

    expect(transactions).toHaveLength(2)
    expect(transactions[1]).toEqual(result)
  })

  it('rejects creation when the account does not exist', async () => {
    await expect(
      service.createTransaction({
        type: 'income',
        amountMinor: 50000,
        description: 'Salary',
        accountId: 'missing-account',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'ACCOUNT_NOT_FOUND',
    })

    expect(transactions).toEqual([existingTransaction])
  })

  it('rejects creation when the account is archived', async () => {
    accounts[0] = {
      ...testAccount,
      archivedAt: '2026-11-06T11:00:00.000Z',
    }

    await expect(
      service.createTransaction({
        type: 'income',
        amountMinor: 50000,
        description: 'Salary',
        accountId: 'account-1',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'ACCOUNT_ARCHIVED',
    })

    expect(transactions).toEqual([existingTransaction])
  })

  it('rejects creation when the transaction amount is zero', async () => {
    await expect(
      service.createTransaction({
        type: 'income',
        amountMinor: 0,
        description: 'Invalid income',
        accountId: 'account-1',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'INVALID_TRANSACTION',
    })

    expect(transactions).toEqual([existingTransaction])
  })

  it('rejects creation when the description is empty', async () => {
    await expect(
      service.createTransaction({
        type: 'income',
        amountMinor: 50000,
        description: '   ',
        accountId: 'account-1',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'INVALID_TRANSACTION',
    })

    expect(transactions).toEqual([existingTransaction])
  })

  it('rejects a non-string description before accessing repositories', async () => {
    const getAccountById = accountRepository.getById
    const getTransactions = transactionRepository.getAll

    accountRepository.getById = async () => {
      throw new Error('Account repository should not be accessed')
    }

    transactionRepository.getAll = async () => {
      throw new Error('Transaction repository should not be accessed')
    }

    await expect(
      service.createTransaction({
        type: 'income',
        amountMinor: 50000,
        description: undefined as unknown as string,
        accountId: 'account-1',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'INVALID_TRANSACTION',
    })

    accountRepository.getById = getAccountById
    transactionRepository.getAll = getTransactions

    expect(transactions).toEqual([existingTransaction])
  })

  it('rejects an expense that would make the account balance negative', async () => {
    await expect(
      service.createTransaction({
        type: 'expense',
        amountMinor: 90000,
        description: 'Over-budget purchase',
        accountId: 'account-1',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'INSUFFICIENT_BALANCE',
    })

    expect(transactions).toEqual([existingTransaction])
  })

  it('rejects creation when the generated transaction ID already exists', async () => {
    const existingTransactionWithSameId: Transaction = {
      ...existingTransaction,
      id: 'transaction-new',
    }

    transactions.push(existingTransactionWithSameId)

    await expect(
      service.createTransaction({
        type: 'income',
        amountMinor: 50000,
        description: 'Salary',
        accountId: 'account-1',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'INVALID_TRANSACTION',
    })

    expect(transactions).toEqual([existingTransaction, existingTransactionWithSameId])
  })

  it('allows an expense that brings the account balance to zero', async () => {
    const result = await service.createTransaction({
      type: 'expense',
      amountMinor: 80000,
      description: 'Final payment',
      accountId: 'account-1',
      date: '2026-11-06',
    })

    expect(result.type).toBe('expense')
    expect(transactions).toHaveLength(2)
    expect(transactions[1]).toEqual(result)
  })

  it('trims whitespace from the transaction description', async () => {
    const result = await service.createTransaction({
      type: 'income',
      amountMinor: 50000,
      description: '  Monthly salary  ',
      accountId: 'account-1',
      date: '2026-11-06',
    })

    expect(result.description).toBe('Monthly salary')
  })

  it('propagates storage errors when saving a transaction fails', async () => {
    const storageError = new Error('Storage write failed')

    transactionRepository.save = async () => {
      throw storageError
    }

    await expect(
      service.createTransaction({
        type: 'income',
        amountMinor: 50000,
        description: 'Salary',
        accountId: 'account-1',
        date: '2026-11-06',
      }),
    ).rejects.toBe(storageError)

    expect(transactions).toEqual([existingTransaction])
  })
})

describe('updateTransaction', () => {
  it('updates an existing transaction and saves it', async () => {
    const result = await service.updateTransaction('transaction-existing', {
      type: 'expense',
      amountMinor: 30000,
      description: 'Updated groceries',
      categoryId: 'category-1',
      date: '2026-11-05',
    })

    expect(result).toEqual({
      ...existingTransaction,
      amountMinor: 30000,
      description: 'Updated groceries',
      categoryId: 'category-1',
      date: '2026-11-05',
      updatedAt: '2026-11-06T12:00:00.000Z',
    })

    expect(transactions).toHaveLength(1)
    expect(transactions[0]).toEqual(result)
  })

  it('rejects an update that would make the account balance negative', async () => {
    await expect(
      service.updateTransaction('transaction-existing', {
        type: 'expense',
        amountMinor: 120000,
        description: 'Over-budget purchase',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'INSUFFICIENT_BALANCE',
    })

    expect(transactions).toEqual([existingTransaction])
  })

  it('rejects updating a transaction that does not exist', async () => {
    await expect(
      service.updateTransaction('missing-transaction', {
        type: 'expense',
        amountMinor: 10000,
        description: 'Some expense',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'TRANSACTION_NOT_FOUND',
    })

    expect(transactions).toEqual([existingTransaction])
  })

  it('rejects updating a transaction with an empty description', async () => {
    await expect(
      service.updateTransaction('transaction-existing', {
        type: 'expense',
        amountMinor: 20000,
        description: '   ',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'INVALID_TRANSACTION',
    })

    expect(transactions).toEqual([existingTransaction])
  })

  it('rejects updating a transaction with a zero amount', async () => {
    await expect(
      service.updateTransaction('transaction-existing', {
        type: 'expense',
        amountMinor: 0,
        description: 'Updated groceries',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'INVALID_TRANSACTION',
    })

    expect(transactions).toEqual([existingTransaction])
  })

  it('rejects updating a transaction when its account does not exist', async () => {
    accounts = []

    await expect(
      service.updateTransaction('transaction-existing', {
        type: 'expense',
        amountMinor: 20000,
        description: 'Updated groceries',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'ACCOUNT_NOT_FOUND',
    })

    expect(transactions).toEqual([existingTransaction])
  })

  it('rejects updating a transaction when its account is archived', async () => {
    accounts[0] = {
      ...testAccount,
      archivedAt: '2026-11-06T11:00:00.000Z',
    }

    await expect(
      service.updateTransaction('transaction-existing', {
        type: 'expense',
        amountMinor: 20000,
        description: 'Updated groceries',
        date: '2026-11-06',
      }),
    ).rejects.toMatchObject({
      name: 'TransactionOperationError',
      code: 'ACCOUNT_ARCHIVED',
    })

    expect(transactions).toEqual([existingTransaction])
  })

  it('propagates storage errors when updating a transaction fails', async () => {
    const storageError = new Error('Storage write failed')

    transactionRepository.save = async () => {
      throw storageError
    }

    await expect(
      service.updateTransaction('transaction-existing', {
        type: 'expense',
        amountMinor: 30000,
        description: 'Updated groceries',
        date: '2026-11-06',
      }),
    ).rejects.toBe(storageError)

    expect(transactions).toEqual([existingTransaction])
  })

  it('allows changing an expense transaction into income', async () => {
    const result = await service.updateTransaction('transaction-existing', {
      type: 'income',
      amountMinor: 20000,
      description: 'Refund',
      date: '2026-11-06',
    })

    expect(result.type).toBe('income')
    expect(result.amountMinor).toBe(20000)
    expect(transactions).toHaveLength(1)
    expect(transactions[0]).toEqual(result)
  })
})

describe('deleteTransaction', () => {
  it('deletes an existing transaction', async () => {
    await service.deleteTransaction(existingTransaction.id)

    expect(transactions).toHaveLength(0)
  })

  it('rejects deleting an income transaction when it would make the account balance negative', async () => {
    const incomeTransaction: Transaction = {
      ...existingTransaction,
      id: 'transaction-income',
      type: 'income',
      amountMinor: 100000,
    }

    const additionalExpense: Transaction = {
      ...existingTransaction,
      id: 'transaction-additional-expense',
      amountMinor: 100000,
    }

    transactions.push(additionalExpense, incomeTransaction)

    await expect(service.deleteTransaction(incomeTransaction.id)).rejects.toMatchObject({
      code: 'INSUFFICIENT_BALANCE',
    })

    expect(transactions).toHaveLength(3)
    expect(transactions).toContainEqual(incomeTransaction)
  })

  it('rejects deleting a transaction that does not exist', async () => {
    await expect(service.deleteTransaction('nonexistent-transaction')).rejects.toMatchObject({
      code: 'TRANSACTION_NOT_FOUND',
    })

    expect(transactions).toHaveLength(1)
    expect(transactions).toContainEqual(existingTransaction)
  })

  it('rejects deleting a transaction when its account does not exist', async () => {
    accounts = []

    await expect(service.deleteTransaction(existingTransaction.id)).rejects.toMatchObject({
      code: 'ACCOUNT_NOT_FOUND',
    })

    expect(transactions).toHaveLength(1)
    expect(transactions).toContainEqual(existingTransaction)
  })

  it('allows deleting a transaction when its account is archived', async () => {
    accounts[0] = {
      ...testAccount,
      archivedAt: '2026-11-06T12:00:00.000Z',
    }

    await service.deleteTransaction(existingTransaction.id)

    expect(transactions).toHaveLength(0)
  })

  it('propagates storage errors when deleting a transaction fails', async () => {
    const storageError = new Error('Storage deletion failed')

    transactionRepository.delete = async () => {
      throw storageError
    }

    await expect(service.deleteTransaction(existingTransaction.id)).rejects.toBe(storageError)

    expect(transactions).toHaveLength(1)
    expect(transactions).toContainEqual(existingTransaction)
  })

  it('allows deleting an income transaction when the account balance remains nonnegative', async () => {
    const incomeTransaction: Transaction = {
      ...existingTransaction,
      id: 'transaction-income',
      type: 'income',
      amountMinor: 20000,
    }

    transactions.push(incomeTransaction)

    await service.deleteTransaction(incomeTransaction.id)

    expect(transactions).toHaveLength(1)
    expect(transactions).toContainEqual(existingTransaction)
  })

  it('allows deleting an expense transaction', async () => {
    await service.deleteTransaction(existingTransaction.id)

    expect(transactions).toHaveLength(0)
  })
})
