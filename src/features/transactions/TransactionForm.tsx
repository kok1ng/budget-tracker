import { useState, type FormEvent } from 'react'

import type { Account } from '../../domain/accounts/account.types'
import { parseAmountToMinorUnits } from '../shared/money-input.utils'
import { getLocalDateString } from '../shared/date.utils'
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
} from '../../services/transactions/transaction.service.types'
import type { Transaction } from '../../domain/transactions/transaction.types'

interface TransactionFormCommonProps {
  accounts: Account[]
}

type TransactionFormProps = TransactionFormCommonProps &
  (
    | {
        mode: 'create'
        onCreateTransaction: (input: CreateTransactionInput) => Promise<Transaction>
      }
    | {
        mode: 'edit'
        transaction: Transaction
        onUpdateTransaction: (id: string, input: UpdateTransactionInput) => Promise<Transaction>
        onCancelEdit: () => void
      }
  )

type FormTransactionType = 'income' | 'expense' | 'transfer'

function formatMinorUnitsForInput(amountMinor: number): string {
  const wholeUnits = Math.floor(amountMinor / 100)
  const fractionalUnits = String(amountMinor % 100).padStart(2, '0')

  return `${wholeUnits}.${fractionalUnits}`
}

function TransactionForm(props: TransactionFormProps) {
  const { accounts } = props
  const activeAccounts = accounts.filter((account) => account.archivedAt === null)

  const [type, setType] = useState<FormTransactionType>(
    props.mode === 'edit' ? props.transaction.type : 'expense',
  )

  const [amount, setAmount] = useState(
    props.mode === 'edit' ? formatMinorUnitsForInput(props.transaction.amountMinor) : '',
  )

  const [description, setDescription] = useState(
    props.mode === 'edit' ? props.transaction.description : '',
  )

  const [accountId, setAccountId] = useState(
    props.mode === 'edit' ? props.transaction.accountId : (activeAccounts[0]?.id ?? ''),
  )

  const [destinationAccountId, setDestinationAccountId] = useState(() => {
    if (props.mode === 'edit' && props.transaction.type === 'transfer') {
      return props.transaction.destinationAccountId ?? ''
    }

    return activeAccounts.find((account) => account.id !== accountId)?.id ?? ''
  })

  const [date, setDate] = useState(
    props.mode === 'edit' ? props.transaction.date : getLocalDateString(),
  )

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const destinationAccounts = activeAccounts.filter((account) => account.id !== accountId)

  if (activeAccounts.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">No active accounts</h2>
        <p className="mt-2 text-sm text-slate-500">
          You need an active account before you can create a transaction. Visit the Accounts page to
          create one.
        </p>
      </section>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage(null)
    setSuccessMessage(null)

    const amountMinor = parseAmountToMinorUnits(amount)

    if (amountMinor === null) {
      setErrorMessage('Enter a valid amount.')
      return
    }

    if (amountMinor <= 0) {
      setErrorMessage('Amount must be greater than zero.')
      return
    }

    if (!activeAccounts.some((account) => account.id === accountId)) {
      setErrorMessage('Please select an active account.')
      return
    }

    if (type === 'transfer') {
      if (activeAccounts.length < 2) {
        setErrorMessage('A transfer requires at least two active accounts.')
        return
      }

      if (!destinationAccounts.some((account) => account.id === destinationAccountId)) {
        setErrorMessage('Please select a different active destination account.')
        return
      }
    }

    setIsSaving(true)

    try {
      const commonInput = {
        amountMinor,
        description: description.trim(),
        accountId,
        date,
      }

      const input: CreateTransactionInput | UpdateTransactionInput =
        type === 'transfer'
          ? {
              ...commonInput,
              type: 'transfer',
              destinationAccountId,
            }
          : {
              ...commonInput,
              type,
              categoryId: props.mode === 'edit' ? props.transaction.categoryId : null,
            }

      if (props.mode === 'create') {
        await props.onCreateTransaction(input)

        const initialAccountId = activeAccounts[0]?.id ?? ''

        setType('expense')
        setAmount('')
        setDescription('')
        setAccountId(initialAccountId)
        setDestinationAccountId(
          activeAccounts.find((account) => account.id !== initialAccountId)?.id ?? '',
        )
        setDate(getLocalDateString())
        setSuccessMessage('Transaction created successfully.')
      } else {
        await props.onUpdateTransaction(props.transaction.id, input)
        setSuccessMessage('Transaction updated successfully.')
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while creating the transaction.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const inputClassName =
    'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        {props.mode === 'create' ? 'Add transaction' : 'Edit transaction'}
      </h2>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="transaction-type" className="block text-sm font-medium text-slate-700">
            Transaction type
          </label>
          <select
            id="transaction-type"
            className={inputClassName}
            value={type}
            onChange={(event) => setType(event.target.value as FormTransactionType)}
            disabled={isSaving}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer" disabled={activeAccounts.length < 2}>
              Transfer
            </option>
          </select>
        </div>

        <div>
          <label htmlFor="transaction-amount" className="block text-sm font-medium text-slate-700">
            Amount
          </label>
          <input
            id="transaction-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 125.50"
            className={inputClassName}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            disabled={isSaving}
          />
          <p className="mt-1 text-xs text-slate-500">Use a period as the decimal separator.</p>
        </div>

        <div>
          <label
            htmlFor="transaction-description"
            className="block text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <input
            id="transaction-description"
            type="text"
            className={inputClassName}
            placeholder="e.g. Groceries"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="transaction-account" className="block text-sm font-medium text-slate-700">
            {type === 'transfer' ? 'From account' : 'Account'}
          </label>
          <select
            id="transaction-account"
            className={inputClassName}
            value={accountId}
            onChange={(event) => {
              const nextAccountId = event.target.value
              setAccountId(nextAccountId)

              if (nextAccountId === destinationAccountId) {
                setDestinationAccountId(
                  activeAccounts.find((account) => account.id !== nextAccountId)?.id ?? '',
                )
              }
            }}
            required
            disabled={isSaving}
          >
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        {type === 'transfer' && (
          <div>
            <label
              htmlFor="transaction-destination-account"
              className="block text-sm font-medium text-slate-700"
            >
              To account
            </label>

            <select
              id="transaction-destination-account"
              className={inputClassName}
              value={destinationAccountId}
              onChange={(event) => setDestinationAccountId(event.target.value)}
              required
              disabled={isSaving}
            >
              {destinationAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label htmlFor="transaction-date" className="block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="transaction-date"
            type="date"
            className={inputClassName}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
            disabled={isSaving}
          />
        </div>

        {errorMessage !== null && (
          <p role="alert" className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        {successMessage !== null && (
          <p role="status" className="text-sm text-green-700">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : props.mode === 'create' ? 'Add transaction' : 'Save changes'}
        </button>

        {props.mode === 'edit' && (
          <button
            type="button"
            onClick={props.onCancelEdit}
            disabled={isSaving}
            className="ml-3 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </form>
    </section>
  )
}

export default TransactionForm
