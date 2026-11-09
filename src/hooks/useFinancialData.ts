import { useEffect, useState } from 'react'

import type { Account } from '../domain/accounts/account.types'
import type { Transaction } from '../domain/transactions/transaction.types'

import { LocalStorageAccountRepository } from '../services/storage/repositories/account.local-storage.repository'
import type { AccountRepository } from '../services/storage/repositories/account.repository'

import { LocalStorageTransactionRepository } from '../services/storage/repositories/transaction.local-storage.repository'
import type { TransactionRepository } from '../services/storage/repositories/transaction.repository'

import { StorageError } from '../services/storage/storage.types'

import { TransactionService } from '../services/transactions/transaction.service'
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../services/transactions/transaction.service.types'

import { createAccount as createAccountOperation } from '../domain/accounts/account.operations'
import type { CreateAccountInput } from '../domain/accounts/account.types'

interface AppData {
  accounts: Account[]
  transactions: Transaction[]
}

interface AppLoadError {
  message: string
  code?: string
}

const accountRepository: AccountRepository = new LocalStorageAccountRepository()

const transactionRepository: TransactionRepository = new LocalStorageTransactionRepository()

const transactionService = new TransactionService(accountRepository, transactionRepository)

export function useFinancialData() {
  const [appData, setAppData] = useState<AppData>({
    accounts: [],
    transactions: [],
  })

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<AppLoadError | null>(null)

  useEffect(() => {
    let isCurrent = true

    async function loadFinancialData() {
      try {
        const [accounts, transactions] = await Promise.all([
          accountRepository.getAll(),
          transactionRepository.getAll(),
        ])

        if (isCurrent) {
          setAppData({ accounts, transactions })
        }
      } catch (error) {
        if (isCurrent) {
          if (error instanceof StorageError) {
            setLoadError({
              message: error.message,
              code: error.code,
            })
          } else {
            setLoadError({
              message: 'An unexpected error occurred while loading financial data.',
            })
          }
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadFinancialData()

    return () => {
      isCurrent = false
    }
  }, [])

  async function createAccount(input: CreateAccountInput): Promise<Account> {
    const timestamp = new Date().toISOString()

    const account: Account = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      type: input.type,
      currency: input.currency,
      openingBalanceMinor: input.openingBalanceMinor,
      createdAt: timestamp,
      updatedAt: timestamp,
      archivedAt: null,
    }

    const updatedAccounts = createAccountOperation(appData.accounts, account)

    await accountRepository.save(account)

    setAppData((currentData) => ({
      ...currentData,
      accounts: updatedAccounts,
    }))

    return account
  }

  async function createTransaction(input: CreateTransactionInput) {
    const transaction = await transactionService.createTransaction(input)

    setAppData((currentData) => ({
      ...currentData,
      transactions: [...currentData.transactions, transaction],
    }))

    return transaction
  }

  async function updateTransaction(id: string, input: UpdateTransactionInput) {
    const transaction = await transactionService.updateTransaction(id, input)

    setAppData((currentData) => ({
      ...currentData,
      transactions: currentData.transactions.map((item) => (item.id === id ? transaction : item)),
    }))

    return transaction
  }

  async function deleteTransaction(id: string) {
    await transactionService.deleteTransaction(id)

    setAppData((currentData) => ({
      ...currentData,
      transactions: currentData.transactions.filter((item) => item.id !== id),
    }))
  }

  return {
    accounts: appData.accounts,
    transactions: appData.transactions,
    isLoading,
    loadError,
    createAccount,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  }
}
