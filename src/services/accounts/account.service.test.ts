import { beforeEach, describe, expect, it } from 'vitest'
import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import type { AccountRepository } from '../storage/repositories/account.repository'
import type { TransactionRepository } from '../storage/repositories/transaction.repository'
import { AccountService } from './account.service'

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

describe('AccountService', () => {
  let accounts: Account[]
  let transactions: Transaction[]
  let accountRepository: AccountRepository
  let transactionRepository: TransactionRepository
  let service: AccountService

  beforeEach(() => {
    accounts = [{ ...testAccount }]
    transactions = []

    accountRepository = {
      getAll: async () => accounts,
      getById: async (id) => accounts.find((account) => account.id === id) ?? null,
      save: async (account) => {
        const index = accounts.findIndex((item) => item.id === account.id)

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
      getById: async (id) => transactions.find((item) => item.id === id) ?? null,
      save: async (transaction) => {
        const index = transactions.findIndex((item) => item.id === transaction.id)

        if (index === -1) {
          transactions.push(transaction)
        } else {
          transactions[index] = transaction
        }
      },
      delete: async (id) => {
        transactions = transactions.filter((item) => item.id !== id)
      },
    }

    service = new AccountService(accountRepository, transactionRepository, {
      generateId: () => 'account-new',
      getCurrentTimestamp: () => '2026-11-06T12:00:00.000Z',
    })
  })

  describe('createAccount', () => {
    it('should create and save a new account', async () => {
      await service.createAccount({
        name: 'Everyday account',
        type: 'debit_card',
        currency: 'USD',
        openingBalanceMinor: 50000,
      })

      expect(accounts).toHaveLength(2)
      expect(accounts[1]).toEqual({
        id: 'account-new',
        name: 'Everyday account',
        type: 'debit_card',
        currency: 'USD',
        openingBalanceMinor: 50000,
        createdAt: '2026-11-06T12:00:00.000Z',
        updatedAt: '2026-11-06T12:00:00.000Z',
        archivedAt: null,
      })
    })

    it('should trim whitespace from the account name', async () => {
      await service.createAccount({
        name: '  Everyday account  ',
        type: 'cash',
        currency: 'USD',
        openingBalanceMinor: 0,
      })

      expect(accounts[1].name).toBe('Everyday account')
    })

    it('should reject an empty account name', async () => {
      await expect(
        service.createAccount({
          name: '   ',
          type: 'cash',
          currency: 'USD',
          openingBalanceMinor: 0,
        }),
      ).rejects.toMatchObject({
        name: 'AccountOperationError',
        code: 'INVALID_ACCOUNT',
      })

      expect(accounts).toHaveLength(1)
    })

    it('should reject a non-string account name', async () => {
      await expect(
        service.createAccount({
          name: undefined as unknown as string,
          type: 'cash',
          currency: 'USD',
          openingBalanceMinor: 0,
        }),
      ).rejects.toMatchObject({
        name: 'AccountOperationError',
        code: 'INVALID_ACCOUNT',
      })

      expect(accounts).toHaveLength(1)
    })

    it('should reject an invalid opening balance', async () => {
      await expect(
        service.createAccount({
          name: 'Invalid account',
          type: 'cash',
          currency: 'USD',
          openingBalanceMinor: -100,
        }),
      ).rejects.toMatchObject({
        name: 'AccountOperationError',
        code: 'INVALID_ACCOUNT',
      })

      expect(accounts).toHaveLength(1)
    })

    it('should reject a duplicate generated account ID', async () => {
      service = new AccountService(accountRepository, transactionRepository, {
        generateId: () => 'account-1',
        getCurrentTimestamp: () => '2026-11-06T12:00:00.000Z',
      })

      await expect(
        service.createAccount({
          name: 'Another account',
          type: 'cash',
          currency: 'USD',
          openingBalanceMinor: 0,
        }),
      ).rejects.toMatchObject({
        name: 'AccountOperationError',
        code: 'INVALID_ACCOUNT',
      })

      expect(accounts).toHaveLength(1)
      expect(accounts[0].name).toBe('Main account')
    })

    it('should propagate account repository save errors', async () => {
      const storageError = new Error('Storage is unavailable')

      accountRepository.save = async () => {
        throw storageError
      }

      await expect(
        service.createAccount({
          name: 'Everyday account',
          type: 'debit_card',
          currency: 'USD',
          openingBalanceMinor: 50000,
        }),
      ).rejects.toBe(storageError)

      expect(accounts).toHaveLength(1)
    })

    it('should allow creating the first account with EUR currency', async () => {
      accounts = []

      await service.createAccount({
        name: 'Euro account',
        type: 'bank_account',
        currency: 'EUR',
        openingBalanceMinor: 50000,
      })

      expect(accounts).toHaveLength(1)
      expect(accounts[0].currency).toBe('EUR')
    })

    it('should reject creating an account with a different currency', async () => {
      await expect(
        service.createAccount({
          name: 'Euro account',
          type: 'cash',
          currency: 'EUR',
          openingBalanceMinor: 50000,
        }),
      ).rejects.toMatchObject({
        name: 'AccountOperationError',
        code: 'CURRENCY_MISMATCH',
      })

      expect(accounts).toHaveLength(1)
    })

    it('should reject a different currency when the existing account is archived', async () => {
      accounts[0] = {
        ...testAccount,
        archivedAt: '2026-11-06T11:00:00.000Z',
      }

      await expect(
        service.createAccount({
          name: 'Euro account',
          type: 'cash',
          currency: 'EUR',
          openingBalanceMinor: 50000,
        }),
      ).rejects.toMatchObject({
        code: 'CURRENCY_MISMATCH',
      })

      expect(accounts).toHaveLength(1)
    })

    it('should allow selecting a new currency after the last account is deleted', async () => {
      await service.deleteAccount('account-1')

      await service.createAccount({
        name: 'Euro account',
        type: 'bank_account',
        currency: 'EUR',
        openingBalanceMinor: 50000,
      })

      expect(accounts).toHaveLength(1)
      expect(accounts[0].currency).toBe('EUR')
    })
  })

  describe('updateAccount', () => {
    it('should update account name and type', async () => {
      await service.updateAccount('account-1', {
        name: 'Updated account',
        type: 'savings',
      })

      expect(accounts[0]).toEqual({
        ...testAccount,
        name: 'Updated account',
        type: 'savings',
        updatedAt: '2026-11-06T12:00:00.000Z',
      })
    })

    it('should trim whitespace from the updated account name', async () => {
      await service.updateAccount('account-1', {
        name: '  Updated account  ',
        type: 'savings',
      })

      expect(accounts[0].name).toBe('Updated account')
    })

    it('should allow updating the opening balance when no transactions exist', async () => {
      await service.updateAccount('account-1', {
        name: 'Main account',
        type: 'bank_account',
        openingBalanceMinor: 150000,
      })

      expect(accounts[0].openingBalanceMinor).toBe(150000)
    })

    it('should reject opening balance changes when associated transactions exist', async () => {
      transactions.push({
        id: 'transaction-1',
        type: 'expense',
        amountMinor: 10000,
        currency: 'USD',
        description: 'Groceries',
        categoryId: null,
        accountId: 'account-1',
        destinationAccountId: null,
        date: '2026-11-06',
        createdAt: '2026-11-06T10:00:00.000Z',
        updatedAt: '2026-11-06T10:00:00.000Z',
      })

      await expect(
        service.updateAccount('account-1', {
          name: 'Main account',
          type: 'bank_account',
          openingBalanceMinor: 150000,
        }),
      ).rejects.toMatchObject({
        name: 'AccountOperationError',
        code: 'OPENING_BALANCE_IMMUTABLE',
      })

      expect(accounts[0].openingBalanceMinor).toBe(100000)
    })

    it('should allow updating the opening balance after all associated transactions are deleted', async () => {
      transactions.push({
        id: 'transaction-1',
        type: 'expense',
        amountMinor: 10000,
        currency: 'USD',
        description: 'Groceries',
        categoryId: null,
        accountId: 'account-1',
        destinationAccountId: null,
        date: '2026-11-06',
        createdAt: '2026-11-06T10:00:00.000Z',
        updatedAt: '2026-11-06T10:00:00.000Z',
      })

      await transactionRepository.delete('transaction-1')

      await service.updateAccount('account-1', {
        name: 'Main account',
        type: 'bank_account',
        openingBalanceMinor: 150000,
      })

      expect(transactions).toHaveLength(0)
      expect(accounts[0].openingBalanceMinor).toBe(150000)
    })

    it('should reject updating an archived account', async () => {
      accounts[0] = {
        ...testAccount,
        archivedAt: '2026-11-06T11:00:00.000Z',
      }

      await expect(
        service.updateAccount('account-1', {
          name: 'Updated account',
          type: 'savings',
        }),
      ).rejects.toMatchObject({
        name: 'AccountOperationError',
        code: 'ACCOUNT_ALREADY_ARCHIVED',
      })

      expect(accounts[0].name).toBe('Main account')
      expect(accounts[0].type).toBe('bank_account')
    })

    it('throws an error when the account does not exist', async () => {
      await expect(
        service.updateAccount('missing-account', {
          name: 'Updated account',
          type: 'cash',
        }),
      ).rejects.toMatchObject({
        code: 'ACCOUNT_NOT_FOUND',
      })

      expect(accounts).toEqual([testAccount])
    })

    it('should reject opening balance changes when a transaction references the account as its destination', async () => {
      transactions.push({
        id: 'transaction-transfer',
        type: 'transfer',
        amountMinor: 20000,
        currency: 'USD',
        description: 'Transfer',
        categoryId: null,
        accountId: 'another-account',
        destinationAccountId: 'account-1',
        date: '2026-11-06',
        createdAt: '2026-11-06T10:00:00.000Z',
        updatedAt: '2026-11-06T10:00:00.000Z',
      })

      await expect(
        service.updateAccount('account-1', {
          name: 'Main account',
          type: 'bank_account',
          openingBalanceMinor: 150000,
        }),
      ).rejects.toMatchObject({
        name: 'AccountOperationError',
        code: 'OPENING_BALANCE_IMMUTABLE',
      })

      expect(accounts[0].openingBalanceMinor).toBe(100000)
    })
  })

  describe('deleteAccount', () => {
    it('deletes an account when it has no associated transactions', async () => {
      await service.deleteAccount('account-1')

      expect(accounts).toHaveLength(0)
    })

    it('rejects deletion when the account does not exist', async () => {
      await expect(service.deleteAccount('missing-account')).rejects.toMatchObject({
        code: 'ACCOUNT_NOT_FOUND',
      })

      expect(accounts).toHaveLength(1)
    })

    it('rejects deletion when a transaction references the account', async () => {
      transactions.push({
        id: 'transaction-1',
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
      })

      await expect(service.deleteAccount('account-1')).rejects.toMatchObject({
        code: 'ACCOUNT_HAS_TRANSACTIONS',
      })

      expect(accounts).toHaveLength(1)
      expect(transactions).toHaveLength(1)
    })

    it('rejects deletion even when the account balance is zero but transaction history exists', async () => {
      accounts[0] = {
        ...testAccount,
        openingBalanceMinor: 20000,
      }

      transactions.push({
        id: 'transaction-1',
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
      })

      await expect(service.deleteAccount('account-1')).rejects.toMatchObject({
        code: 'ACCOUNT_HAS_TRANSACTIONS',
      })

      expect(accounts).toHaveLength(1)
    })

    it('rejects deletion when a transaction references the account as its destination', async () => {
      transactions.push({
        id: 'transaction-1',
        type: 'transfer',
        amountMinor: 20000,
        currency: 'USD',
        description: 'Transfer',
        categoryId: null,
        accountId: 'another-account',
        destinationAccountId: 'account-1',
        date: '2026-11-06',
        createdAt: '2026-11-06T10:00:00.000Z',
        updatedAt: '2026-11-06T10:00:00.000Z',
      })

      await expect(service.deleteAccount('account-1')).rejects.toMatchObject({
        code: 'ACCOUNT_HAS_TRANSACTIONS',
      })

      expect(accounts).toHaveLength(1)
      expect(transactions).toHaveLength(1)
    })
  })

  describe('archiveAccount', () => {
    it('archives an account when its calculated balance is zero', async () => {
      accounts[0] = {
        ...testAccount,
        openingBalanceMinor: 0,
      }

      await service.archiveAccount('account-1')

      expect(accounts[0].archivedAt).toBe('2026-11-06T12:00:00.000Z')
      expect(accounts[0].updatedAt).toBe('2026-11-06T12:00:00.000Z')
    })

    it('rejects archiving an account with a positive balance', async () => {
      await expect(service.archiveAccount('account-1')).rejects.toMatchObject({
        code: 'ACCOUNT_BALANCE_NOT_ZERO',
      })

      expect(accounts[0].archivedAt).toBeNull()
      expect(accounts[0].openingBalanceMinor).toBe(100000)
    })

    it('rejects archiving an account with a negative balance', async () => {
      accounts[0] = {
        ...testAccount,
        openingBalanceMinor: -10000,
      }

      await expect(service.archiveAccount('account-1')).rejects.toMatchObject({
        code: 'ACCOUNT_BALANCE_NOT_ZERO',
      })

      expect(accounts[0].archivedAt).toBeNull()
    })

    it('rejects archiving an account that is already archived', async () => {
      accounts[0] = {
        ...testAccount,
        archivedAt: '2026-11-05T10:00:00.000Z',
      }

      await expect(service.archiveAccount('account-1')).rejects.toMatchObject({
        code: 'ACCOUNT_ALREADY_ARCHIVED',
      })

      expect(accounts[0].archivedAt).toBe('2026-11-05T10:00:00.000Z')
    })

    it('rejects archiving an account that does not exist', async () => {
      await expect(service.archiveAccount('missing-account')).rejects.toMatchObject({
        code: 'ACCOUNT_NOT_FOUND',
      })

      expect(accounts).toHaveLength(1)
    })

    it('preserves associated transactions when archiving an account', async () => {
      accounts[0] = {
        ...testAccount,
        openingBalanceMinor: 20000,
      }

      transactions.push({
        id: 'transaction-1',
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
      })

      await service.archiveAccount('account-1')

      expect(accounts[0].archivedAt).toBe('2026-11-06T12:00:00.000Z')
      expect(transactions).toHaveLength(1)
      expect(transactions[0].id).toBe('transaction-1')
    })
  })

  describe('restoreAccount', () => {
    it('restores an archived account', async () => {
      accounts[0] = {
        ...testAccount,
        archivedAt: '2026-11-05T10:00:00.000Z',
      }

      await service.restoreAccount('account-1')

      expect(accounts[0].archivedAt).toBeNull()
      expect(accounts[0].updatedAt).toBe('2026-11-06T12:00:00.000Z')
      expect(accounts[0].name).toBe(testAccount.name)
      expect(accounts[0].openingBalanceMinor).toBe(testAccount.openingBalanceMinor)
    })

    it('rejects restoring an account that is not archived', async () => {
      await expect(service.restoreAccount('account-1')).rejects.toMatchObject({
        code: 'ACCOUNT_NOT_ARCHIVED',
      })

      expect(accounts[0].archivedAt).toBeNull()
    })

    it('rejects restoring an account that does not exist', async () => {
      await expect(service.restoreAccount('missing-account')).rejects.toMatchObject({
        code: 'ACCOUNT_NOT_FOUND',
      })

      expect(accounts).toHaveLength(1)
    })
  })
})
