import type { Transaction } from '../../../domain/transactions/transaction.types'

export interface TransactionRepository {
  getAll(): Promise<Transaction[]>
  getById(id: string): Promise<Transaction | null>
  save(transaction: Transaction): Promise<void>
  delete(id: string): Promise<void>
}
