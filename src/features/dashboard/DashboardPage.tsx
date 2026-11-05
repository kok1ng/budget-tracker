import type { Transaction } from '../../domain/transactions/transaction.types'
import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'

interface DashboardPageProps {
  transactions: Transaction[]
}

function DashboardPage({ transactions }: DashboardPageProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Dashboard" description="Here's an overview of your finances." />

      <section>
        <StatCard title="Balance" amount="$0.00" variant="dark" size="large" />
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard title="Income" amount="$0.00" />
        <StatCard title="Expenses" amount="$0.00" />
      </section>

      <section>
        <Card>
          <h3 className="text-lg font-semibold">Recent transactions</h3>

          {transactions.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">No transactions yet.</p>
              <p className="mt-1 text-sm text-slate-400">
                Your recent transactions will appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <li key={transaction.id}>{transaction.description}</li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  )
}

export default DashboardPage
