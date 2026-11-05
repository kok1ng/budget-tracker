import type { Transaction } from '../../../domain/transactions/transaction.types'
import { isValidTransaction } from '../../../domain/transactions/transaction.validation'
import { readStorageCollection, writeStorageCollection } from '../storage-collection.utils'
import type { TransactionRepository } from './transaction.repository'

const TRANSACTIONS_STORAGE_KEY = 'budget-tracker:transactions'

export class LocalStorageTransactionRepository implements TransactionRepository {
  async getAll(): Promise<Transaction[]> {
    return readStorageCollection(TRANSACTIONS_STORAGE_KEY, isValidTransaction)
  }

  async getById(id: string): Promise<Transaction | null> {
    const transactions = await this.getAll()

    return transactions.find((transaction) => transaction.id === id) ?? null
  }

  async save(transaction: Transaction): Promise<void> {
    const transactions = await this.getAll()
    const existingIndex = transactions.findIndex(
      (existingTransaction) => existingTransaction.id === transaction.id,
    )

    if (existingIndex === -1) {
      transactions.push(transaction)
    } else {
      transactions[existingIndex] = transaction
    }

    writeStorageCollection(TRANSACTIONS_STORAGE_KEY, transactions, isValidTransaction)
  }

  async delete(id: string): Promise<void> {
    const transactions = await this.getAll()
    const updatedTransactions = transactions.filter((transaction) => transaction.id !== id)

    writeStorageCollection(TRANSACTIONS_STORAGE_KEY, updatedTransactions, isValidTransaction)
  }
}
