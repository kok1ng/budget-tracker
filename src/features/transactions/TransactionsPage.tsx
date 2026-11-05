import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import PageHeader from '../../components/ui/PageHeader'

interface TransactionsPageProps {
  transactions: Transaction[]
  accounts: Account[]
}

function TransactionsPage({ transactions, accounts }: TransactionsPageProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Transactions" description="Manage your income and expenses." />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {transactions.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">No transactions yet.</p>
            <p className="mt-1 text-sm text-slate-400">Your transactions will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {transactions.map((transaction) => {
              const account = accounts.find((item) => item.id === transaction.accountId)

              return (
                <li key={transaction.id}>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-slate-500">
                    {account?.name ?? 'Unknown account'} · {transaction.date}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default TransactionsPage
