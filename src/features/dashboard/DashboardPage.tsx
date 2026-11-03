import Card from '../../components/ui/Card'
import PageHeader from '../../components/ui/PageHeader'
import StatCard from '../../components/ui/StatCard'

function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Page title */}
      <PageHeader title="Dashboard" description="Here's an overview of your finances." />

      {/* Balance */}
      <section>
        <StatCard title="Balance" amount="$0.00" variant="dark" size="large" />
      </section>

      {/* Income and Expenses */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard title="Income" amount="$0.00" />
        <StatCard title="Expenses" amount="$0.00" />
      </section>

      {/* Recent transactions */}
      <section>
        <Card>
          <h3 className="text-lg font-semibold">Recent transactions</h3>

          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">No transactions yet.</p>
            <p className="mt-1 text-sm text-slate-400">
              Your recent transactions will appear here.
            </p>
          </div>
        </Card>
      </section>
    </div>
  )
}

export default DashboardPage
