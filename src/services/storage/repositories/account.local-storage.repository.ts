import type { Account } from '../../../domain/accounts/account.types'
import { isValidAccount } from '../../../domain/accounts/account.validation'
import { readStorageCollection, writeStorageCollection } from '../storage-collection.utils'
import type { AccountRepository } from './account.repository'

const ACCOUNTS_STORAGE_KEY = 'budget-tracker:accounts'

export class LocalStorageAccountRepository implements AccountRepository {
  async getAll(): Promise<Account[]> {
    return readStorageCollection(ACCOUNTS_STORAGE_KEY, isValidAccount)
  }

  async getById(id: string): Promise<Account | null> {
    const accounts = await this.getAll()

    return accounts.find((account) => account.id === id) ?? null
  }

  async save(account: Account): Promise<void> {
    const accounts = await this.getAll()
    const existingIndex = accounts.findIndex((existingAccount) => existingAccount.id === account.id)

    if (existingIndex === -1) {
      accounts.push(account)
    } else {
      accounts[existingIndex] = account
    }

    writeStorageCollection(ACCOUNTS_STORAGE_KEY, accounts, isValidAccount)
  }

  async delete(id: string): Promise<void> {
    const accounts = await this.getAll()
    const updatedAccounts = accounts.filter((account) => account.id !== id)

    writeStorageCollection(ACCOUNTS_STORAGE_KEY, updatedAccounts, isValidAccount)
  }
}
