import type { ReactNode } from 'react'
import type { Page } from '../../app/types'

type AppLayoutProps = {
  children: ReactNode
  activePage: Page
  onPageChange: (page: Page) => void
}

const navigationItems: { label: string; page: Page }[] = [
  { label: 'Dashboard', page: 'dashboard' },
  { label: 'Transactions', page: 'transactions' },
  { label: 'Accounts', page: 'accounts' },
  { label: 'Categories', page: 'categories' },
  { label: 'Budgets', page: 'budgets' },
  { label: 'Settings', page: 'settings' },
]

function AppLayout({ children, activePage, onPageChange }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      {/* Sidebar */}
      <aside className="w-full border-b border-slate-200 bg-white px-5 py-6 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:px-6">
        <div className="text-xl font-bold tracking-tight">Budget Tracker</div>

        <nav className="mt-8" aria-label="Main navigation">
          <ul className="flex gap-2 overflow-x-auto md:flex-col">
            {navigationItems.map((item) => (
              <li key={item.page}>
                <button
                  type="button"
                  aria-current={activePage === item.page ? 'page' : undefined}
                  onClick={() => onPageChange(item.page)}
                  className={`block w-full whitespace-nowrap rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    activePage === item.page
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-6 py-5 sm:px-8">
          <h1 className="text-xl font-semibold">Budget Tracker</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your personal finances</p>
        </header>

        <main className="px-6 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
