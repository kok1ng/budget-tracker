import { useEffect, useState } from 'react'

import type { Account } from '../domain/accounts/account.types'
import type { Transaction } from '../domain/transactions/transaction.types'
import type { Category } from '../domain/categories/category.types'
import type { Budget } from '../domain/budgets/budget.types'

import { LocalStorageAccountRepository } from '../services/storage/repositories/accounts/account.local-storage.repository'
import type { AccountRepository } from '../services/storage/repositories/accounts/account.repository'

import { LocalStorageTransactionRepository } from '../services/storage/repositories/transactions/transaction.local-storage.repository'
import type { TransactionRepository } from '../services/storage/repositories/transactions/transaction.repository'

import { LocalStorageCategoryRepository } from '../services/storage/repositories/categories/category.local-storage.repository'
import type { CategoryRepository } from '../services/storage/repositories/categories/category.repository'

import { LocalStorageBudgetRepository } from '../services/storage/repositories/budgets/budget.local-storage.repository'
import type { BudgetRepository } from '../services/storage/repositories/budgets/budget.repository'

import { StorageError } from '../services/storage/storage.types'

import { TransactionService } from '../services/transactions/transaction.service'
import { AccountService } from '../services/accounts/account.service'
import { CategoryService } from '../services/categories/category.service'
import { BudgetService } from '../services/budgets/budget.service'

import type { UpdateAccountInput } from '../services/accounts/account.service.types'
import type { CreateAccountInput } from '../domain/accounts/account.types'
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../services/categories/category.service.types'
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../services/transactions/transaction.service.types'
import type { CreateBudgetInput, UpdateBudgetInput } from '../services/budgets/budget.service.types'

interface AppData {
  accounts: Account[]
  transactions: Transaction[]
  categories: Category[]
  budgets: Budget[]
}

interface AppLoadError {
  message: string
  code?: string
}

const accountRepository: AccountRepository = new LocalStorageAccountRepository()
const transactionRepository: TransactionRepository = new LocalStorageTransactionRepository()
const categoryRepository: CategoryRepository = new LocalStorageCategoryRepository()
const budgetRepository: BudgetRepository = new LocalStorageBudgetRepository()

const transactionService = new TransactionService(
  accountRepository,
  transactionRepository,
  categoryRepository,
)
const accountService = new AccountService(accountRepository, transactionRepository)
const categoryService = new CategoryService(
  categoryRepository,
  transactionRepository,
  budgetRepository,
)
const budgetService = new BudgetService(budgetRepository, categoryRepository)

export function useFinancialData() {
  const [appData, setAppData] = useState<AppData>({
    accounts: [],
    transactions: [],
    categories: [],
    budgets: [],
  })

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<AppLoadError | null>(null)

  useEffect(() => {
    let isCurrent = true

    async function loadFinancialData() {
      try {
        const [accounts, transactions, categories, budgets] = await Promise.all([
          accountRepository.getAll(),
          transactionRepository.getAll(),
          categoryService.getAllCategories(),
          budgetService.getAllBudgets(),
        ])

        if (isCurrent) {
          setAppData({ accounts, transactions, categories, budgets })
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
    const account = await accountService.createAccount(input)

    setAppData((currentData) => ({
      ...currentData,
      accounts: [...currentData.accounts, account],
    }))

    return account
  }

  async function updateAccount(id: string, input: UpdateAccountInput): Promise<Account> {
    const updatedAccount = await accountService.updateAccount(id, input)

    setAppData((currentData) => ({
      ...currentData,
      accounts: currentData.accounts.map((account) =>
        account.id === id ? updatedAccount : account,
      ),
    }))

    return updatedAccount
  }

  async function deleteAccount(id: string): Promise<void> {
    await accountService.deleteAccount(id)

    setAppData((currentData) => ({
      ...currentData,
      accounts: currentData.accounts.filter((account) => account.id !== id),
    }))
  }

  async function archiveAccount(id: string): Promise<Account> {
    const archivedAccount = await accountService.archiveAccount(id)

    setAppData((currentData) => ({
      ...currentData,
      accounts: currentData.accounts.map((account) =>
        account.id === id ? archivedAccount : account,
      ),
    }))

    return archivedAccount
  }

  async function restoreAccount(id: string): Promise<Account> {
    const restoredAccount = await accountService.restoreAccount(id)

    setAppData((currentData) => ({
      ...currentData,
      accounts: currentData.accounts.map((account) =>
        account.id === id ? restoredAccount : account,
      ),
    }))

    return restoredAccount
  }

  async function createCategory(input: CreateCategoryInput): Promise<Category> {
    const category = await categoryService.createCategory(input)

    setAppData((currentData) => ({
      ...currentData,
      categories: [...currentData.categories, category],
    }))

    return category
  }

  async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
    const updatedCategory = await categoryService.updateCategory(id, input)

    setAppData((currentData) => ({
      ...currentData,
      categories: currentData.categories.map((category) =>
        category.id === id ? updatedCategory : category,
      ),
    }))

    return updatedCategory
  }

  async function deleteCategory(id: string): Promise<void> {
    await categoryService.deleteCategory(id)

    setAppData((currentData) => ({
      ...currentData,
      categories: currentData.categories.filter((category) => category.id !== id),
    }))
  }

  async function createBudget(input: CreateBudgetInput): Promise<Budget> {
    const budget = await budgetService.createBudget(input)

    setAppData((currentData) => ({
      ...currentData,
      budgets: [...currentData.budgets, budget],
    }))

    return budget
  }

  async function updateBudget(id: string, input: UpdateBudgetInput): Promise<Budget> {
    const updatedBudget = await budgetService.updateBudget(id, input)

    setAppData((currentData) => ({
      ...currentData,
      budgets: currentData.budgets.map((budget) => (budget.id === id ? updatedBudget : budget)),
    }))

    return updatedBudget
  }

  async function deleteBudget(id: string): Promise<void> {
    await budgetService.deleteBudget(id)

    setAppData((currentData) => ({
      ...currentData,
      budgets: currentData.budgets.filter((budget) => budget.id !== id),
    }))
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
    categories: appData.categories,
    budgets: appData.budgets,
    isLoading,
    loadError,
    createAccount,
    updateAccount,
    deleteAccount,
    archiveAccount,
    restoreAccount,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createCategory,
    updateCategory,
    deleteCategory,
    createBudget,
    updateBudget,
    deleteBudget,
  }
}
