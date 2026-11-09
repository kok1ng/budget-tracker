import { calculateAccountBalance } from '../../domain/accounts/account.calculations'
import { isValidTransaction } from '../../domain/transactions/transaction.validation'
import { TransactionOperationError } from './transaction-operation.errors'
import type { AccountRepository } from '../storage/repositories/account.repository'
import type { TransactionRepository } from '../storage/repositories/transaction.repository'
import type { Transaction } from '../../domain/transactions/transaction.types'
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

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    if (typeof input.description !== 'string' || input.description.trim().length === 0) {
      throw new TransactionOperationError(
        'INVALID_TRANSACTION',
        'Transaction description cannot be empty.',
      )
    }

    const account = await this.accountRepository.getById(input.accountId)

    if (account === null) {
      throw new TransactionOperationError(
        'ACCOUNT_NOT_FOUND',
        'The selected account does not exist.',
      )
    }

    if (account.archivedAt !== null) {
      throw new TransactionOperationError(
        'ACCOUNT_ARCHIVED',
        'Cannot create a transaction for an archived account.',
      )
    }

    const transactions = await this.transactionRepository.getAll()

    const timestamp = this.getCurrentTimestamp()

    const transaction: Transaction = {
      id: this.generateId(),
      type: input.type,
      amountMinor: input.amountMinor,
      currency: account.currency,
      description: input.description.trim(),
      categoryId: input.categoryId ?? null,
      accountId: account.id,
      destinationAccountId: null,
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

    const resultingBalance = calculateAccountBalance(account, [...transactions, transaction])

    if (resultingBalance < 0) {
      throw new TransactionOperationError(
        'INSUFFICIENT_BALANCE',
        'The transaction would make the account balance negative.',
      )
    }

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

    const targetAccount =
      input.accountId === originalAccount.id
        ? originalAccount
        : await this.accountRepository.getById(input.accountId)

    if (targetAccount === null) {
      throw new TransactionOperationError(
        'ACCOUNT_NOT_FOUND',
        'The selected destination account does not exist.',
      )
    }

    if (targetAccount.archivedAt !== null) {
      throw new TransactionOperationError(
        'ACCOUNT_ARCHIVED',
        'Cannot move a transaction to an archived account.',
      )
    }

    const updatedTransaction: Transaction = {
      ...existingTransaction,
      type: input.type,
      amountMinor: input.amountMinor,
      currency: targetAccount.currency,
      accountId: targetAccount.id,
      description: input.description.trim(),
      categoryId: input.categoryId ?? null,
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

    const originalAccountBalance = calculateAccountBalance(originalAccount, updatedTransactions)

    if (originalAccountBalance < 0) {
      throw new TransactionOperationError(
        'INSUFFICIENT_BALANCE',
        'Updating the transaction would make the original account balance negative.',
      )
    }

    if (targetAccount.id !== originalAccount.id) {
      const targetAccountBalance = calculateAccountBalance(targetAccount, updatedTransactions)

      if (targetAccountBalance < 0) {
        throw new TransactionOperationError(
          'INSUFFICIENT_BALANCE',
          'Moving the transaction would make the destination account balance negative.',
        )
      }
    }

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

    const account = await this.accountRepository.getById(existingTransaction.accountId)

    if (account === null) {
      throw new TransactionOperationError(
        'ACCOUNT_NOT_FOUND',
        'The transaction account does not exist.',
      )
    }

    const transactions = await this.transactionRepository.getAll()

    const remainingTransactions = transactions.filter((transaction) => transaction.id !== id)

    const resultingBalance = calculateAccountBalance(account, remainingTransactions)

    if (resultingBalance < 0) {
      throw new TransactionOperationError(
        'INSUFFICIENT_BALANCE',
        'Deleting this transaction would make the account balance negative.',
      )
    }

    await this.transactionRepository.delete(id)
  }
}
