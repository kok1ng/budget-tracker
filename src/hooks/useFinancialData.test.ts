import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Account } from '../domain/accounts/account.types'
import type { Transaction } from '../domain/transactions/transaction.types'

import type { UpdateAccountInput } from '../services/accounts/account.service.types'

import { useFinancialData } from './useFinancialData'

const repositoryMocks = vi.hoisted(() => ({
  accountGetAll: vi.fn(),
  accountGetById: vi.fn(),
  accountSave: vi.fn(),
  accountDelete: vi.fn(),
  transactionGetAll: vi.fn(),
  transactionGetById: vi.fn(),
  transactionSave: vi.fn(),
  transactionDelete: vi.fn(),
}))

vi.mock('../services/storage/repositories/account.local-storage.repository', () => ({
  LocalStorageAccountRepository: class {
    getAll = repositoryMocks.accountGetAll
    getById = repositoryMocks.accountGetById
    save = repositoryMocks.accountSave
    delete = repositoryMocks.accountDelete
  },
}))

vi.mock('../services/storage/repositories/transaction.local-storage.repository', () => ({
  LocalStorageTransactionRepository: class {
    getAll = repositoryMocks.transactionGetAll
    getById = repositoryMocks.transactionGetById
    save = repositoryMocks.transactionSave
    delete = repositoryMocks.transactionDelete
  },
}))

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

describe('useFinancialData', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    accounts = [{ ...testAccount }]
    transactions = [{ ...existingTransaction }]

    repositoryMocks.accountGetAll.mockImplementation(async () =>
      accounts.map((account) => ({ ...account })),
    )
    repositoryMocks.accountGetById.mockImplementation(
      async (id: string) => accounts.find((account) => account.id === id) ?? null,
    )
    repositoryMocks.accountSave.mockImplementation(async (account: Account) => {
      const index = accounts.findIndex((item) => item.id === account.id)

      if (index === -1) {
        accounts.push(account)
      } else {
        accounts[index] = account
      }
    })
    repositoryMocks.accountDelete.mockImplementation(async (id: string) => {
      accounts = accounts.filter((account) => account.id !== id)
    })

    repositoryMocks.transactionGetAll.mockImplementation(async () =>
      transactions.map((transaction) => ({ ...transaction })),
    )
    repositoryMocks.transactionGetById.mockImplementation(
      async (id: string) => transactions.find((transaction) => transaction.id === id) ?? null,
    )
    repositoryMocks.transactionSave.mockImplementation(async (transaction: Transaction) => {
      const index = transactions.findIndex((item) => item.id === transaction.id)

      if (index === -1) {
        transactions.push(transaction)
      } else {
        transactions[index] = transaction
      }
    })
    repositoryMocks.transactionDelete.mockImplementation(async (id: string) => {
      transactions = transactions.filter((transaction) => transaction.id !== id)
    })
  })

  it('loads accounts and transactions', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.accounts).toEqual([testAccount])
    expect(result.current.transactions).toEqual([existingTransaction])
    expect(result.current.loadError).toBeNull()
  })

  it('adds an account to state after successful creation', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let createdAccount: Account | undefined

    await act(async () => {
      createdAccount = await result.current.createAccount({
        name: '  Savings account  ',
        type: 'savings',
        currency: 'EUR',
        openingBalanceMinor: 250000,
      })
    })

    expect(createdAccount).toBeDefined()
    expect(createdAccount).toMatchObject({
      name: 'Savings account',
      type: 'savings',
      currency: 'EUR',
      openingBalanceMinor: 250000,
      archivedAt: null,
    })

    expect(createdAccount?.id).toBeTruthy()
    expect(createdAccount?.createdAt).toBe(createdAccount?.updatedAt)

    expect(result.current.accounts).toHaveLength(2)
    expect(result.current.accounts[1]).toEqual(createdAccount)

    expect(repositoryMocks.accountSave).toHaveBeenCalledOnce()
    expect(repositoryMocks.accountSave).toHaveBeenCalledWith(createdAccount)
  })

  it('does not save an account when account creation validation fails', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const initialAccounts = result.current.accounts

    await act(async () => {
      await expect(
        result.current.createAccount({
          name: '   ',
          type: 'savings',
          currency: 'EUR',
          openingBalanceMinor: 250000,
        }),
      ).rejects.toMatchObject({
        name: 'AccountOperationError',
        code: 'INVALID_ACCOUNT',
      })
    })

    expect(result.current.accounts).toEqual(initialAccounts)
    expect(repositoryMocks.accountSave).not.toHaveBeenCalled()
  })

  it('keeps account state unchanged when account persistence fails', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const initialAccounts = result.current.accounts

    repositoryMocks.accountSave.mockRejectedValueOnce(new Error('Storage write failed'))

    await expect(
      act(async () => {
        await result.current.createAccount({
          name: 'Savings account',
          type: 'savings',
          currency: 'EUR',
          openingBalanceMinor: 250000,
        })
      }),
    ).rejects.toThrow('Storage write failed')

    expect(result.current.accounts).toEqual(initialAccounts)
  })

  it('adds a transaction to state after successful creation', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let createdTransaction: Transaction | undefined

    await act(async () => {
      createdTransaction = await result.current.createTransaction({
        type: 'income',
        amountMinor: 50000,
        description: 'Monthly salary',
        accountId: 'account-1',
        date: '2026-11-07',
      })
    })

    expect(createdTransaction).toBeDefined()
    expect(result.current.transactions).toHaveLength(2)
    expect(result.current.transactions[1]).toEqual(createdTransaction)
    expect(repositoryMocks.transactionSave).toHaveBeenCalledOnce()
  })

  it('updates a transaction in state after successful update', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let updatedTransaction: Transaction | undefined

    await act(async () => {
      updatedTransaction = await result.current.updateTransaction('transaction-existing', {
        type: 'expense',
        amountMinor: 25000,
        description: 'Updated groceries',
        categoryId: null,
        accountId: 'account-1',
        date: '2026-11-07',
      })
    })

    expect(result.current.transactions).toHaveLength(1)
    expect(result.current.transactions[0]).toEqual(updatedTransaction)
    expect(result.current.transactions[0].description).toBe('Updated groceries')
    expect(repositoryMocks.transactionSave).toHaveBeenCalledOnce()
  })

  it('removes a transaction from state after successful deletion', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteTransaction('transaction-existing')
    })

    expect(result.current.transactions).toEqual([])
    expect(repositoryMocks.transactionDelete).toHaveBeenCalledWith('transaction-existing')
  })

  it('keeps state unchanged when transaction creation fails', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const initialTransactions = result.current.transactions

    await act(async () => {
      await expect(
        result.current.createTransaction({
          type: 'expense',
          amountMinor: 0,
          description: 'Failed transaction',
          accountId: 'account-1',
          date: '2026-11-07',
        }),
      ).rejects.toMatchObject({
        name: 'TransactionOperationError',
        code: 'INVALID_TRANSACTION',
      })
    })

    expect(result.current.transactions).toEqual(initialTransactions)
    expect(repositoryMocks.transactionSave).not.toHaveBeenCalled()
  })

  it('keeps state unchanged when transaction persistence fails', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const initialTransactions = result.current.transactions

    repositoryMocks.transactionSave.mockRejectedValueOnce(new Error('Storage write failed'))

    await expect(
      act(async () => {
        await result.current.createTransaction({
          type: 'income',
          amountMinor: 50000,
          description: 'Monthly salary',
          accountId: 'account-1',
          date: '2026-11-07',
        })
      }),
    ).rejects.toThrow('Storage write failed')

    expect(result.current.transactions).toEqual(initialTransactions)
  })

  it('updates an account in state after successful update', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    let updatedAccount: Account | undefined

    const input: UpdateAccountInput = {
      name: 'Updated main account',
      type: 'savings',
    }

    await act(async () => {
      updatedAccount = await result.current.updateAccount('account-1', input)
    })

    expect(updatedAccount).toMatchObject({
      id: 'account-1',
      name: 'Updated main account',
      type: 'savings',
    })

    expect(result.current.accounts).toHaveLength(1)
    expect(result.current.accounts[0]).toEqual(updatedAccount)

    expect(repositoryMocks.accountSave).toHaveBeenCalledOnce()
    expect(repositoryMocks.accountSave).toHaveBeenCalledWith(updatedAccount)
  })

  it('keeps account state unchanged when account update fails', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const initialAccounts = result.current.accounts

    await act(async () => {
      await expect(
        result.current.updateAccount('account-1', {
          name: 'Updated main account',
          type: 'savings',
          openingBalanceMinor: 150000,
        }),
      ).rejects.toMatchObject({
        name: 'AccountOperationError',
        code: 'OPENING_BALANCE_IMMUTABLE',
      })
    })

    expect(result.current.accounts).toEqual(initialAccounts)
    expect(repositoryMocks.accountSave).not.toHaveBeenCalled()
  })

  it('removes an account from state after successful deletion', async () => {
    const secondAccount: Account = {
      ...testAccount,
      id: 'account-2',
      name: 'Savings account',
    }

    accounts.push(secondAccount)

    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(2)
    })

    await act(async () => {
      await result.current.deleteAccount('account-2')
    })

    expect(result.current.accounts).toHaveLength(1)
    expect(result.current.accounts[0]).toEqual(testAccount)
    expect(repositoryMocks.accountDelete).toHaveBeenCalledWith('account-2')
  })

  it('keeps account state unchanged when deletion fails because transactions exist', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(1)
    })

    await expect(result.current.deleteAccount('account-1')).rejects.toMatchObject({
      name: 'AccountOperationError',
      code: 'ACCOUNT_HAS_TRANSACTIONS',
    })

    expect(result.current.accounts).toEqual([testAccount])
    expect(repositoryMocks.accountDelete).not.toHaveBeenCalled()
  })

  it('updates an account in state after successful archiving', async () => {
    const zeroBalanceAccount: Account = {
      ...testAccount,
      id: 'account-2',
      name: 'Empty account',
      openingBalanceMinor: 0,
    }

    accounts.push(zeroBalanceAccount)

    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(2)
    })

    let archivedAccount: Account | undefined

    await act(async () => {
      archivedAccount = await result.current.archiveAccount('account-2')
    })

    expect(archivedAccount?.archivedAt).not.toBeNull()
    expect(result.current.accounts).toHaveLength(2)
    expect(result.current.accounts[1]).toEqual(archivedAccount)

    expect(repositoryMocks.accountSave).toHaveBeenCalledOnce()
    expect(repositoryMocks.accountSave).toHaveBeenCalledWith(archivedAccount)
  })

  it('keeps account state unchanged when archiving fails because balance is not zero', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const initialAccounts = result.current.accounts

    await expect(result.current.archiveAccount('account-1')).rejects.toMatchObject({
      name: 'AccountOperationError',
      code: 'ACCOUNT_BALANCE_NOT_ZERO',
    })

    expect(result.current.accounts).toEqual(initialAccounts)
    expect(repositoryMocks.accountSave).not.toHaveBeenCalled()
  })

  it('updates an account in state after successful restoration', async () => {
    const archivedAccount: Account = {
      ...testAccount,
      id: 'account-2',
      name: 'Archived account',
      openingBalanceMinor: 0,
      archivedAt: '2026-11-07T10:00:00.000Z',
    }

    accounts.push(archivedAccount)

    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.accounts).toHaveLength(2)
    })

    let restoredAccount: Account | undefined

    await act(async () => {
      restoredAccount = await result.current.restoreAccount('account-2')
    })

    expect(restoredAccount?.archivedAt).toBeNull()
    expect(result.current.accounts).toHaveLength(2)
    expect(result.current.accounts[1]).toEqual(restoredAccount)

    expect(repositoryMocks.accountSave).toHaveBeenCalledOnce()
    expect(repositoryMocks.accountSave).toHaveBeenCalledWith(restoredAccount)
  })

  it('keeps account state unchanged when restoration fails because account is already active', async () => {
    const { result } = renderHook(() => useFinancialData())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const initialAccounts = result.current.accounts

    await expect(result.current.restoreAccount('account-1')).rejects.toMatchObject({
      name: 'AccountOperationError',
      code: 'ACCOUNT_NOT_ARCHIVED',
    })

    expect(result.current.accounts).toEqual(initialAccounts)
    expect(repositoryMocks.accountSave).not.toHaveBeenCalled()
  })
})
