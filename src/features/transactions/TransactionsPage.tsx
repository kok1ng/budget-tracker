import PageHeader from '../../components/ui/PageHeader'

function TransactionsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Transactions" description="Manage your income and expenses." />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="py-10 text-center">
          <p className="text-sm text-slate-500">No transactions yet.</p>
          <p className="mt-1 text-sm text-slate-400">Your transactions will appear here.</p>
        </div>
      </div>
    </div>
  )
}

export default TransactionsPage
