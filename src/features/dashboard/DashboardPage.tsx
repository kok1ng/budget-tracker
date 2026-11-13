import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import type { Page } from '../../app/types'
import { calculateDashboardData } from './dashboard.calculations'
import { getLocalDateString } from '../shared/date.utils'
import { formatMoney } from '../../domain/money/money.utils'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'

interface DashboardPageProps {
  accounts: Account[]
  transactions: Transaction[]
  onPageChange: (page: Page) => void
}

function formatTransactionDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)

  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDashboardPeriod(today: string): string {
  const [year, month, day] = today.split('-').map(Number)

  const monthName = new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
  })

  return `${monthName} 1–${day}, ${year}`
}

function DashboardPage({ accounts, transactions, onPageChange }: DashboardPageProps) {
  const today = getLocalDateString()
  const dashboardData = calculateDashboardData(accounts, transactions, today)
  const currency = dashboardData.currency

  function formatDashboardAmount(amountMinor: number): string {
    return currency === null ? (amountMinor / 100).toFixed(2) : formatMoney(amountMinor, currency)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Dashboard" description="Here's an overview of your finances." />

      {accounts.length === 0 && (
        <Card>
          <div className="py-4 text-center">
            <h2 className="text-lg font-semibold text-slate-900">No accounts yet</h2>
            <p className="mt-2 text-sm text-slate-500">
              Create your first account to start tracking your finances.
            </p>
            <button
              type="button"
              onClick={() => onPageChange('accounts')}
              className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Manage accounts
            </button>
          </div>
        </Card>
      )}

      <section>
        <StatCard
          title="Total balance"
          amount={formatDashboardAmount(dashboardData.totalBalanceMinor)}
          variant="dark"
          size="large"
        />
      </section>

      <section>
        <p className="text-xs text-slate-500">
          Reporting period: {formatDashboardPeriod(today)} (month to date)
        </p>
      </section>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Income" amount={formatDashboardAmount(dashboardData.monthlyIncomeMinor)} />
        <StatCard
          title="Expenses"
          amount={formatDashboardAmount(dashboardData.monthlyExpensesMinor)}
        />
        <StatCard
          title="Net cash flow"
          amount={formatDashboardAmount(dashboardData.netCashFlowMinor)}
        />
      </section>

      <section>
        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Recent transactions</h2>

            <button
              type="button"
              onClick={() => onPageChange('transactions')}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              View all
            </button>
          </div>

          {dashboardData.recentTransactions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">No transactions yet.</p>
              <p className="mt-1 text-sm text-slate-400">
                Your recent transactions will appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {dashboardData.recentTransactions.map((transaction) => {
                const account = accounts.find((item) => item.id === transaction.accountId)

                const destinationAccount =
                  transaction.type === 'transfer' && transaction.destinationAccountId !== null
                    ? accounts.find((item) => item.id === transaction.destinationAccountId)
                    : undefined

                const amountPrefix =
                  transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '−' : ''

                const amountColor =
                  transaction.type === 'income'
                    ? 'text-green-600'
                    : transaction.type === 'expense'
                      ? 'text-red-600'
                      : 'text-slate-700'

                return (
                  <li
                    key={transaction.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {transaction.description}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {transaction.type === 'transfer' ? (
                          <>
                            {account?.name ?? 'Unknown account'} →{' '}
                            {destinationAccount?.name ?? 'Unknown account'}
                          </>
                        ) : (
                          (account?.name ?? 'Unknown account')
                        )}
                        {' · '}
                        {formatTransactionDate(transaction.date)}
                      </p>
                    </div>

                    <p className={`shrink-0 font-semibold ${amountColor}`}>
                      {amountPrefix}
                      {formatMoney(transaction.amountMinor, transaction.currency)}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </section>

      <section>
        <Card>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">Accounts</h2>

            <button
              type="button"
              onClick={() => onPageChange('accounts')}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              Manage accounts
            </button>
          </div>

          {dashboardData.accountBalances.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">No active accounts.</p>
              <p className="mt-1 text-sm text-slate-400">
                Archived accounts are not included in your current balance.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {dashboardData.accountBalances.map(({ account, balanceMinor }) => (
                <li
                  key={account.id}
                  className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <p className="font-medium text-slate-900">{account.name}</p>
                  <p className="shrink-0 font-semibold text-slate-700">
                    {formatDashboardAmount(balanceMinor)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  )
}

export default DashboardPage
