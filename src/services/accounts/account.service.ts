import { isValidAccount } from '../../domain/accounts/account.validation'
import { calculateAccountBalance } from '../../domain/accounts/account.calculations'
import {
  archiveAccount as archiveAccountOperation,
  createAccount as createAccountOperation,
  deleteAccount as deleteAccountOperation,
  restoreAccount as restoreAccountOperation,
  updateAccount as updateAccountOperation,
} from '../../domain/accounts/account.operations'

import type { Account, CreateAccountInput } from '../../domain/accounts/account.types'

import type { AccountRepository } from '../storage/repositories/account.repository'
import type { TransactionRepository } from '../storage/repositories/transaction.repository'

import { AccountOperationError } from './account-operation.errors'
import type { UpdateAccountInput } from './account.service.types'

export interface AccountServiceOptions {
  generateId: () => string
  getCurrentTimestamp: () => string
}

export class AccountService {
  private readonly accountRepository: AccountRepository
  private readonly transactionRepository: TransactionRepository

  private readonly generateId: () => string
  private readonly getCurrentTimestamp: () => string

  constructor(
    accountRepository: AccountRepository,
    transactionRepository: TransactionRepository,
    options: Partial<AccountServiceOptions> = {},
  ) {
    this.accountRepository = accountRepository
    this.transactionRepository = transactionRepository

    this.generateId = options.generateId ?? (() => crypto.randomUUID())
    this.getCurrentTimestamp = options.getCurrentTimestamp ?? (() => new Date().toISOString())
  }

  async createAccount(input: CreateAccountInput): Promise<Account> {
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      throw new AccountOperationError('INVALID_ACCOUNT', 'Account name cannot be empty.')
    }

    const timestamp = this.getCurrentTimestamp()

    const account: Account = {
      id: this.generateId(),
      name: input.name.trim(),
      type: input.type,
      currency: input.currency,
      openingBalanceMinor: input.openingBalanceMinor,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
    }

    const accounts = await this.accountRepository.getAll()

    if (!isValidAccount(account)) {
      throw new AccountOperationError('INVALID_ACCOUNT', 'The account contains invalid data.')
    }

    if (accounts.some((existing) => existing.id === account.id)) {
      throw new AccountOperationError('INVALID_ACCOUNT', 'The generated account ID already exists.')
    }

    createAccountOperation(accounts, account)

    await this.accountRepository.save(account)

    return account
  }

  async updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
    if (typeof input.name !== 'string' || input.name.trim().length === 0) {
      throw new AccountOperationError('INVALID_ACCOUNT', 'Account name cannot be empty.')
    }

    const existingAccount = await this.accountRepository.getById(id)

    if (existingAccount === null) {
      throw new AccountOperationError('ACCOUNT_NOT_FOUND', 'Account not found.')
    }

    if (existingAccount.archivedAt !== null) {
      throw new AccountOperationError(
        'ACCOUNT_ALREADY_ARCHIVED',
        'Archived accounts cannot be edited. Restore the account first.',
      )
    }

    const transactions = await this.transactionRepository.getAll()

    const hasTransactions = transactions.some(
      (transaction) => transaction.accountId === id || transaction.destinationAccountId === id,
    )

    const openingBalanceMinor = input.openingBalanceMinor ?? existingAccount.openingBalanceMinor

    if (hasTransactions && openingBalanceMinor !== existingAccount.openingBalanceMinor) {
      throw new AccountOperationError(
        'OPENING_BALANCE_IMMUTABLE',
        'The opening balance cannot be changed because this account has transactions.',
      )
    }

    const updatedAccount: Account = {
      ...existingAccount,
      name: input.name.trim(),
      type: input.type,
      openingBalanceMinor,
      updatedAt: this.getCurrentTimestamp(),
    }

    const accounts = await this.accountRepository.getAll()

    if (!isValidAccount(updatedAccount)) {
      throw new AccountOperationError('INVALID_ACCOUNT', 'The account contains invalid data.')
    }

    updateAccountOperation(accounts, updatedAccount)

    await this.accountRepository.save(updatedAccount)

    return updatedAccount
  }

  async deleteAccount(id: string): Promise<void> {
    const accounts = await this.accountRepository.getAll()

    if (!accounts.some((account) => account.id === id)) {
      throw new AccountOperationError('ACCOUNT_NOT_FOUND', 'Account not found.')
    }

    const transactions = await this.transactionRepository.getAll()

    const hasTransactions = transactions.some(
      (transaction) => transaction.accountId === id || transaction.destinationAccountId === id,
    )

    if (hasTransactions) {
      throw new AccountOperationError(
        'ACCOUNT_HAS_TRANSACTIONS',
        'Cannot delete an account with existing transactions.',
      )
    }

    deleteAccountOperation(accounts, id, transactions)

    await this.accountRepository.delete(id)
  }

  async archiveAccount(id: string): Promise<Account> {
    const existingAccount = await this.accountRepository.getById(id)

    if (existingAccount === null) {
      throw new AccountOperationError('ACCOUNT_NOT_FOUND', 'Account not found.')
    }

    if (existingAccount.archivedAt !== null) {
      throw new AccountOperationError(
        'ACCOUNT_ALREADY_ARCHIVED',
        'This account is already archived.',
      )
    }

    const transactions = await this.transactionRepository.getAll()

    const currentBalance = calculateAccountBalance(existingAccount, transactions)

    if (currentBalance !== 0) {
      throw new AccountOperationError(
        'ACCOUNT_BALANCE_NOT_ZERO',
        'This account has a remaining balance. Transfer the money to another account before archiving it.',
      )
    }

    const accounts = await this.accountRepository.getAll()

    const timestamp = this.getCurrentTimestamp()

    const accountToArchive: Account = {
      ...existingAccount,
      archivedAt: timestamp,
      updatedAt: timestamp,
    }

    if (!isValidAccount(accountToArchive)) {
      throw new AccountOperationError(
        'INVALID_ACCOUNT',
        'The archive timestamp or account data is invalid.',
      )
    }

    const updatedAccounts = archiveAccountOperation(accounts, id, timestamp)

    const archivedAccount = updatedAccounts.find((account) => account.id === id)

    if (archivedAccount === undefined) {
      throw new AccountOperationError('ACCOUNT_NOT_FOUND', 'Account not found.')
    }

    await this.accountRepository.save(archivedAccount)

    return archivedAccount
  }

  async restoreAccount(id: string): Promise<Account> {
    const existingAccount = await this.accountRepository.getById(id)

    if (existingAccount === null) {
      throw new AccountOperationError('ACCOUNT_NOT_FOUND', 'Account not found.')
    }

    if (existingAccount.archivedAt === null) {
      throw new AccountOperationError('ACCOUNT_NOT_ARCHIVED', 'This account is not archived.')
    }

    const accounts = await this.accountRepository.getAll()

    const timestamp = this.getCurrentTimestamp()

    const accountToRestore: Account = {
      ...existingAccount,
      archivedAt: null,
      updatedAt: timestamp,
    }

    if (!isValidAccount(accountToRestore)) {
      throw new AccountOperationError(
        'INVALID_ACCOUNT',
        'The restore timestamp or account data is invalid.',
      )
    }

    const updatedAccounts = restoreAccountOperation(accounts, id, timestamp)

    const restoredAccount = updatedAccounts.find((account) => account.id === id)

    if (restoredAccount === undefined) {
      throw new AccountOperationError('ACCOUNT_NOT_FOUND', 'Account not found.')
    }

    await this.accountRepository.save(restoredAccount)

    return restoredAccount
  }
}
