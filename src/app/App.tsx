import { useEffect, useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import DashboardPage from '../features/dashboard/DashboardPage'
import TransactionsPage from '../features/transactions/TransactionsPage'
import CategoriesPage from '../features/categories/CategoriesPage'
import BudgetsPage from '../features/budgets/BudgetsPage'
import SettingsPage from '../features/settings/SettingsPage'
import type { Account } from '../domain/accounts/account.types'
import type { Transaction } from '../domain/transactions/transaction.types'
import { LocalStorageAccountRepository } from '../services/storage/repositories/account.local-storage.repository'
import type { AccountRepository } from '../services/storage/repositories/account.repository'
import { LocalStorageTransactionRepository } from '../services/storage/repositories/transaction.local-storage.repository'
import type { TransactionRepository } from '../services/storage/repositories/transaction.repository'
import { StorageError } from '../services/storage/storage.types'
import type { Page } from './types'

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

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')
  const [appData, setAppData] = useState<AppData>({
    accounts: [],
    transactions: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<AppLoadError | null>(null)

  useEffect(() => {
    let isCurrent = true

    async function loadAppData() {
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

    void loadAppData()

    return () => {
      isCurrent = false
    }
  }, [])

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage transactions={appData.transactions} />
      case 'transactions':
        return <TransactionsPage transactions={appData.transactions} accounts={appData.accounts} />
      case 'categories':
        return <CategoriesPage />
      case 'budgets':
        return <BudgetsPage />
      case 'settings':
        return <SettingsPage />
    }
  }

  return (
    <AppLayout activePage={activePage} onPageChange={setActivePage}>
      {isLoading ? (
        <p role="status">Loading financial data...</p>
      ) : loadError !== null ? (
        <section role="alert">
          <h2>Unable to load your financial data</h2>
          <p>{loadError.message}</p>
          {loadError.code && <p>Error code: {loadError.code}</p>}
        </section>
      ) : (
        renderPage()
      )}
    </AppLayout>
  )
}

export default App
