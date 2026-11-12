import { useState } from 'react'
import { formatMoney } from '../../domain/money/money.utils'
import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../../services/transactions/transaction.service.types'

import PageHeader from '../../components/ui/PageHeader'
import TransactionForm from './TransactionForm'

type TransactionTypeFilter = 'all' | 'income' | 'expense' | 'transfer'

type TransactionSortOrder = 'newest' | 'oldest'

interface TransactionsPageProps {
  transactions: Transaction[]
  accounts: Account[]
  onCreateTransaction: (input: CreateTransactionInput) => Promise<Transaction>
  onUpdateTransaction: (id: string, input: UpdateTransactionInput) => Promise<Transaction>
  onDeleteTransaction: (id: string) => Promise<void>
}

function TransactionsPage({
  transactions,
  accounts,
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
}: TransactionsPageProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TransactionTypeFilter>('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<TransactionSortOrder>('newest')

  const filteredTransactions = transactions
    .filter((transaction) => {
      return typeFilter === 'all' || transaction.type === typeFilter
    })
    .filter((transaction) => {
      return (
        accountFilter === 'all' ||
        transaction.accountId === accountFilter ||
        transaction.destinationAccountId === accountFilter
      )
    })
    .sort((a, b) => {
      return sortOrder === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)
    })

  async function handleUpdateTransaction(
    id: string,
    input: UpdateTransactionInput,
  ): Promise<Transaction> {
    const updatedTransaction = await onUpdateTransaction(id, input)

    setEditingTransaction(null)

    return updatedTransaction
  }

  async function handleDeleteTransaction(transaction: Transaction): Promise<void> {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${transaction.description}"?`,
    )

    if (!confirmed) {
      return
    }

    setDeletingTransactionId(transaction.id)
    setDeleteError(null)

    try {
      await onDeleteTransaction(transaction.id)

      // If this transaction was being edited, close the edit form.
      if (editingTransaction?.id === transaction.id) {
        setEditingTransaction(null)
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete the transaction.')
    } finally {
      setDeletingTransactionId(null)
    }
  }
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Transactions" description="Manage your income, expenses, and transfers." />
      {deleteError !== null && (
        <p role="alert" className="text-sm text-red-600">
          {deleteError}
        </p>
      )}

      {editingTransaction === null ? (
        <TransactionForm
          mode="create"
          accounts={accounts}
          onCreateTransaction={onCreateTransaction}
        />
      ) : (
        <TransactionForm
          key={editingTransaction.id}
          mode="edit"
          accounts={accounts}
          transaction={editingTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onCancelEdit={() => setEditingTransaction(null)}
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="transaction-type-filter"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Transaction type
            </label>

            <select
              id="transaction-type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TransactionTypeFilter)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
              <option value="transfer">Transfers</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="transaction-account-filter"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Account
            </label>

            <select
              id="transaction-account-filter"
              value={accountFilter}
              onChange={(event) => setAccountFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">All accounts</option>

              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                  {account.archivedAt !== null ? ' (Archived)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="transaction-sort-order"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Sort by date
            </label>

            <select
              id="transaction-sort-order"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value as TransactionSortOrder)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">No transactions yet.</p>
            <p className="mt-1 text-sm text-slate-400">Your transactions will appear here.</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-slate-500">No transactions match your filters.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredTransactions.map((transaction) => {
              const account = accounts.find((item) => item.id === transaction.accountId)

              const destinationAccount =
                transaction.type === 'transfer' && transaction.destinationAccountId !== null
                  ? accounts.find((item) => item.id === transaction.destinationAccountId)
                  : undefined

              const isDestinationAccountUnavailable =
                transaction.type === 'transfer' &&
                (destinationAccount === undefined || destinationAccount.archivedAt !== null)

              return (
                <li key={transaction.id} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-slate-500">
                      {transaction.type === 'transfer' ? (
                        <>
                          {account?.name ?? 'Unknown account'} →{' '}
                          {destinationAccount?.name ?? 'Unknown account'}
                        </>
                      ) : (
                        (account?.name ?? 'Unknown account')
                      )}{' '}
                      · {transaction.date}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <p
                      className={`font-semibold ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : transaction.type === 'expense'
                            ? 'text-red-600'
                            : 'text-slate-700'
                      }`}
                    >
                      {transaction.type === 'income'
                        ? '+'
                        : transaction.type === 'expense'
                          ? '−'
                          : ''}
                      {formatMoney(transaction.amountMinor, transaction.currency)}
                    </p>

                    <button
                      type="button"
                      onClick={() => setEditingTransaction(transaction)}
                      disabled={
                        deletingTransactionId === transaction.id ||
                        account === undefined ||
                        account.archivedAt !== null ||
                        isDestinationAccountUnavailable
                      }
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTransaction(transaction)}
                      disabled={deletingTransactionId === transaction.id}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingTransactionId === transaction.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
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
