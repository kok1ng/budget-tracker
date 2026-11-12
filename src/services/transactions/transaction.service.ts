
import { calculateAccountBalance } from '../../domain/accounts/account.calculations'
import { isValidTransaction } from '../../domain/transactions/transaction.validation'
import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import { TransactionOperationError } from './transaction-operation.errors'
import type { AccountRepository } from '../storage/repositories/account.repository'
import type { TransactionRepository } from '../storage/repositories/transaction.repository'
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionServiceOptions,
} from './transaction.service.types'

export class TransactionService {
  private readonly accountRepository: AccountRepository
  private readonly transactionRepository: TransactionRepository

  private readonly generateId: () => string
  private readonly getCurrentTimestamp: () => string

  constructor(
    accountRepository: AccountRepository,
    transactionRepository: TransactionRepository,
    options: Partial<TransactionServiceOptions> = {},
  ) {
    this.accountRepository = accountRepository
    this.transactionRepository = transactionRepository

    this.generateId = options.generateId ?? (() => crypto.randomUUID())
    this.getCurrentTimestamp = options.getCurrentTimestamp ?? (() => new Date().toISOString())
  }

  private async ensureNonNegativeBalances(
    accountIds: string[],
    transactions: Transaction[],
  ): Promise<void> {
    const uniqueAccountIds = [...new Set(accountIds)]

    for (const accountId of uniqueAccountIds) {
      const account = await this.accountRepository.getById(accountId)

      if (account === null) {
        throw new TransactionOperationError(
          'ACCOUNT_NOT_FOUND',
          'An account associated with the transaction does not exist.',
        )
      }

      const resultingBalance = calculateAccountBalance(account, transactions)

      if (resultingBalance < 0) {
        throw new TransactionOperationError(
          'INSUFFICIENT_BALANCE',
          'The operation would make an account balance negative.',
        )
      }
    }
  }

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    if (typeof input.description !== 'string' || input.description.trim().length === 0) {
      throw new TransactionOperationError(
        'INVALID_TRANSACTION',
        'Transaction description cannot be empty.',
      )
    }

    const sourceAccount = await this.accountRepository.getById(input.accountId)

    if (sourceAccount === null) {
      throw new TransactionOperationError(
        'ACCOUNT_NOT_FOUND',
        'The selected account does not exist.',
      )
    }

    if (sourceAccount.archivedAt !== null) {
      throw new TransactionOperationError(
        'ACCOUNT_ARCHIVED',
        'Cannot create a transaction for an archived account.',
      )
    }

    let destinationAccount: Account | null = null

    if (input.type === 'transfer') {
      if (input.destinationAccountId === sourceAccount.id) {
        throw new TransactionOperationError(
          'INVALID_TRANSACTION',
          'Source and destination accounts must be different.',
        )
      }

      destinationAccount = await this.accountRepository.getById(input.destinationAccountId)

      if (destinationAccount === null) {
        throw new TransactionOperationError(
          'ACCOUNT_NOT_FOUND',
          'The selected destination account does not exist.',
        )
      }

      if (destinationAccount.archivedAt !== null) {
        throw new TransactionOperationError(
          'ACCOUNT_ARCHIVED',
          'Cannot transfer money to an archived account.',
        )
      }

      if (destinationAccount.currency !== sourceAccount.currency) {
        throw new TransactionOperationError(
          'INVALID_TRANSACTION',
          'Source and destination accounts must use the same currency.',
        )
      }
    }

    const transactions = await this.transactionRepository.getAll()
    const timestamp = this.getCurrentTimestamp()

    const transaction: Transaction = {
      id: this.generateId(),
      type: input.type,
      amountMinor: input.amountMinor,
      currency: sourceAccount.currency,
      description: input.description.trim(),
      categoryId: input.type === 'transfer' ? null : (input.categoryId ?? null),
      accountId: sourceAccount.id,
      destinationAccountId: destinationAccount?.id ?? null,
      date: input.date,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    if (!isValidTransaction(transaction)) {
      throw new TransactionOperationError(
        'INVALID_TRANSACTION',
        'The transaction contains invalid data.',
      )
    }

    if (transactions.some((existing) => existing.id === transaction.id)) {
      throw new TransactionOperationError(
        'INVALID_TRANSACTION',
        'The generated transaction ID already exists.',
      )
    }

    await this.ensureNonNegativeBalances(
      [sourceAccount.id, ...(destinationAccount ? [destinationAccount.id] : [])],
      [...transactions, transaction],
    )

    await this.transactionRepository.save(transaction)

    return transaction
  }

  async updateTransaction(id: string, input: UpdateTransactionInput): Promise<Transaction> {
    const existingTransaction = await this.transactionRepository.getById(id)

    if (existingTransaction === null) {
      throw new TransactionOperationError(
        'TRANSACTION_NOT_FOUND',
        'The transaction does not exist.',
      )
    }

    if (typeof input.description !== 'string' || input.description.trim().length === 0) {
      throw new TransactionOperationError(
        'INVALID_TRANSACTION',
        'Transaction description cannot be empty.',
      )
    }

    const originalAccount = await this.accountRepository.getById(existingTransaction.accountId)

    if (originalAccount === null) {
      throw new TransactionOperationError(
        'ACCOUNT_NOT_FOUND',
        'The transaction account does not exist.',
      )
    }

    if (originalAccount.archivedAt !== null) {
      throw new TransactionOperationError(
        'ACCOUNT_ARCHIVED',
        'Cannot update a transaction for an archived account.',
      )
    }

    const sourceAccount =
      input.accountId === originalAccount.id
        ? originalAccount
        : await this.accountRepository.getById(input.accountId)

    if (sourceAccount === null) {
      throw new TransactionOperationError(
        'ACCOUNT_NOT_FOUND',
        'The selected source account does not exist.',
      )
    }

    if (sourceAccount.archivedAt !== null) {
      throw new TransactionOperationError(
        'ACCOUNT_ARCHIVED',
        'Cannot move a transaction to an archived account.',
      )
    }

    let destinationAccount: Account | null = null

    if (input.type === 'transfer') {
      if (input.destinationAccountId === sourceAccount.id) {
        throw new TransactionOperationError(
          'INVALID_TRANSACTION',
          'Source and destination accounts must be different.',
        )
      }

      destinationAccount = await this.accountRepository.getById(input.destinationAccountId)

      if (destinationAccount === null) {
        throw new TransactionOperationError(
          'ACCOUNT_NOT_FOUND',
          'The selected destination account does not exist.',
        )
      }

      if (destinationAccount.archivedAt !== null) {
        throw new TransactionOperationError(
          'ACCOUNT_ARCHIVED',
          'Cannot transfer money to an archived account.',
        )
      }

      if (destinationAccount.currency !== sourceAccount.currency) {
        throw new TransactionOperationError(
          'INVALID_TRANSACTION',
          'Source and destination accounts must use the same currency.',
        )
      }
    }

    const updatedTransaction: Transaction = {
      ...existingTransaction,
      type: input.type,
      amountMinor: input.amountMinor,
      currency: sourceAccount.currency,
      accountId: sourceAccount.id,
      destinationAccountId: destinationAccount?.id ?? null,
      description: input.description.trim(),
      categoryId: input.type === 'transfer' ? null : (input.categoryId ?? null),
      date: input.date,
      updatedAt: this.getCurrentTimestamp(),
    }

    if (!isValidTransaction(updatedTransaction)) {
      throw new TransactionOperationError(
        'INVALID_TRANSACTION',
        'The transaction contains invalid data.',
      )
    }

    const transactions = await this.transactionRepository.getAll()

    const updatedTransactions = transactions.map((transaction) =>
      transaction.id === id ? updatedTransaction : transaction,
    )

    const affectedAccountIds = [
      existingTransaction.accountId,
      ...(existingTransaction.destinationAccountId
        ? [existingTransaction.destinationAccountId]
        : []),
      sourceAccount.id,
      ...(destinationAccount ? [destinationAccount.id] : []),
    ]

    await this.ensureNonNegativeBalances(affectedAccountIds, updatedTransactions)

    await this.transactionRepository.save(updatedTransaction)

    return updatedTransaction
  }

  async deleteTransaction(id: string): Promise<void> {
    const existingTransaction = await this.transactionRepository.getById(id)

    if (existingTransaction === null) {
      throw new TransactionOperationError(
        'TRANSACTION_NOT_FOUND',
        'The transaction does not exist.',
      )
    }

    const transactions = await this.transactionRepository.getAll()

    const remainingTransactions = transactions.filter((transaction) => transaction.id !== id)

    const affectedAccountIds = [
      existingTransaction.accountId,
      ...(existingTransaction.destinationAccountId
        ? [existingTransaction.destinationAccountId]
        : []),
    ]

    await this.ensureNonNegativeBalances(affectedAccountIds, remainingTransactions)

    await this.transactionRepository.delete(id)
  }
}
