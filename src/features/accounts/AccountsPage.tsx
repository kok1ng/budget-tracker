import { useState } from 'react'
import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import { calculateAccountBalance } from '../../domain/accounts/account.calculations'
import { formatMoney } from '../../domain/money/money.utils'
import type { CreateAccountInput } from '../../domain/accounts/account.types'
import type { UpdateAccountInput } from '../../services/accounts/account.service.types'

import PageHeader from '../../components/ui/PageHeader'
import AccountForm from './AccountForm'
import AccountEditDialog from './AccountEditDialog'

interface AccountsPageProps {
  accounts: Account[]
  transactions: Transaction[]
  onCreateAccount: (input: CreateAccountInput) => Promise<Account>
  onUpdateAccount: (id: string, input: UpdateAccountInput) => Promise<Account>
  onDeleteAccount: (id: string) => Promise<void>
  onArchiveAccount: (id: string) => Promise<Account>
  onRestoreAccount: (id: string) => Promise<Account>
}

function AccountsPage({
  accounts,
  transactions,
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  onArchiveAccount,
  onRestoreAccount,
}: AccountsPageProps) {
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const activeAccounts = accounts.filter((account) => account.archivedAt === null)
  const archivedAccounts = accounts.filter((account) => account.archivedAt !== null)
  const deletingArchivedAccount = accountToDelete !== null && accountToDelete.archivedAt !== null

  async function handleArchiveAccount(id: string) {
    setActionError(null)

    try {
      await onArchiveAccount(id)
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while archiving the account.',
      )
    }
  }

  async function handleRestoreAccount(id: string) {
    setActionError(null)

    try {
      await onRestoreAccount(id)
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while restoring the account.',
      )
    }
  }

  async function handleDeleteAccount() {
    if (accountToDelete === null) {
      return
    }

    setActionError(null)

    try {
      await onDeleteAccount(accountToDelete.id)
      setAccountToDelete(null)
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while deleting the account.',
      )
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Accounts" description="Manage your accounts and track their balances." />

      <AccountForm onCreateAccount={onCreateAccount} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Active accounts</h2>
        {actionError !== null && !deletingArchivedAccount && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {actionError}
          </p>
        )}

        {activeAccounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No active accounts.</p>
        ) : (
          <ul className="mt-6 divide-y divide-slate-100">
            {activeAccounts.map((account) => {
              const currentBalance = calculateAccountBalance(account, transactions)
              const canArchive = currentBalance === 0

              return (
                <li
                  key={account.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{account.name}</p>
                    <p className="text-sm text-slate-500">{account.type.replace('_', ' ')}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-slate-900">
                      {formatMoney(currentBalance, account.currency)}
                    </p>

                    <button
                      type="button"
                      onClick={() => setSelectedAccount(account)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleArchiveAccount(account.id)}
                      disabled={!canArchive}
                      title={
                        canArchive
                          ? 'Archive account'
                          : 'Transfer the remaining balance before archiving.'
                      }
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Archive
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActionError(null)
                        setAccountToDelete(account)
                      }}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>

                  {!canArchive && (
                    <p className="text-xs text-slate-500 sm:basis-full">
                      Transfer the remaining balance before archiving this account.
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        {accountToDelete !== null && !deletingArchivedAccount && (
          <section
            aria-labelledby="delete-account-heading"
            className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-5"
          >
            <h3 id="delete-account-heading" className="text-lg font-semibold text-slate-900">
              Delete {accountToDelete.name}?
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              This action cannot be undone. Accounts with existing transactions cannot be deleted.
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setActionError(null)
                  setAccountToDelete(null)
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Confirm delete
              </button>
            </div>
          </section>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Archived accounts</h2>
        {actionError !== null && deletingArchivedAccount && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {actionError}
          </p>
        )}

        {archivedAccounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No archived accounts.</p>
        ) : (
          <ul className="mt-6 divide-y divide-slate-100">
            {archivedAccounts.map((account) => {
              const currentBalance = calculateAccountBalance(account, transactions)

              return (
                <li
                  key={account.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-900">{account.name}</p>
                    <p className="text-sm text-slate-500">
                      {account.type.replace('_', ' ')} · Archived
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-slate-900">
                      {formatMoney(currentBalance, account.currency)}
                    </p>

                    <button
                      type="button"
                      onClick={() => void handleRestoreAccount(account.id)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Restore
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActionError(null)
                        setAccountToDelete(account)
                      }}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {accountToDelete !== null && deletingArchivedAccount && (
          <section
            aria-labelledby="delete-account-heading"
            className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-5"
          >
            <h3 id="delete-account-heading" className="text-lg font-semibold text-slate-900">
              Delete {accountToDelete.name}?
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              This action cannot be undone. Accounts with existing transactions cannot be deleted.
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setActionError(null)
                  setAccountToDelete(null)
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Confirm delete
              </button>
            </div>
          </section>
        )}
      </section>

      {selectedAccount !== null && (
        <AccountEditDialog
          key={selectedAccount.id}
          account={selectedAccount}
          openingBalanceEditable={
            !transactions.some(
              (transaction) =>
                transaction.accountId === selectedAccount.id ||
                transaction.destinationAccountId === selectedAccount.id,
            )
          }
          onUpdateAccount={onUpdateAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </div>
  )
}

export default AccountsPage
