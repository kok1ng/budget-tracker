import { useState } from 'react'

import AppLayout from '../components/layout/AppLayout'
import DashboardPage from '../features/dashboard/DashboardPage'
import TransactionsPage from '../features/transactions/TransactionsPage'
import CategoriesPage from '../features/categories/CategoriesPage'
import BudgetsPage from '../features/budgets/BudgetsPage'
import SettingsPage from '../features/settings/SettingsPage'
import AccountsPage from '../features/accounts/AccountsPage'

import { useFinancialData } from '../hooks/useFinancialData'

import type { Page } from './types'

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')

  const {
    accounts,
    transactions,
    isLoading,
    loadError,
    createAccount,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  } = useFinancialData()

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage transactions={transactions} />
      case 'transactions':
        return (
          <TransactionsPage
            transactions={transactions}
            accounts={accounts}
            onCreateTransaction={createTransaction}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        )
      case 'accounts':
        return (
          <AccountsPage
            accounts={accounts}
            transactions={transactions}
            onCreateAccount={createAccount}
          />
        )
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
