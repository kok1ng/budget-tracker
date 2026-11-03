import { useState } from 'react'
import AppLayout from '../components/layout/AppLayout'
import DashboardPage from '../features/dashboard/DashboardPage'
import TransactionsPage from '../features/transactions/TransactionsPage'
import CategoriesPage from '../features/categories/CategoriesPage'
import BudgetsPage from '../features/budgets/BudgetsPage'
import SettingsPage from '../features/settings/SettingsPage'
import type { Page } from './types'

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard')

  function renderPage() {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />
      case 'transactions':
        return <TransactionsPage />
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
      {renderPage()}
    </AppLayout>
  )
}

export default App
