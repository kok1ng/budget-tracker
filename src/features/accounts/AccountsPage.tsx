import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import { calculateAccountBalance } from '../../domain/accounts/account.calculations'
import { formatMoney } from '../../domain/money/money.utils'
import type { CreateAccountInput } from '../../domain/accounts/account.types'

import PageHeader from '../../components/ui/PageHeader'
import AccountForm from './AccountForm'

interface AccountsPageProps {
  accounts: Account[]
  transactions: Transaction[]
  onCreateAccount: (input: CreateAccountInput) => Promise<Account>
}

function AccountsPage({ accounts, transactions, onCreateAccount }: AccountsPageProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Accounts" description="Manage your accounts and track their balances." />

      <AccountForm onCreateAccount={onCreateAccount} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Your accounts</h2>

        {accounts.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">No accounts yet.</p>
            <p className="mt-1 text-sm text-slate-400">
              Create your first account using the form above.
            </p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-slate-100">
            {accounts.map((account) => {
              const currentBalance = calculateAccountBalance(account, transactions)

              return (
                <li
                  key={account.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{account.name}</p>
                    <p className="text-sm text-slate-500">
                      {account.type.replace('_', ' ')}
                      {account.archivedAt !== null && ' · Archived'}
                    </p>
                  </div>

                  <p className="font-semibold text-slate-900">
                    {formatMoney(currentBalance, account.currency)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

export default AccountsPage
