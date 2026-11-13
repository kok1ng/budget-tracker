import { useState, type FormEvent } from 'react'

import type { AccountType, CreateAccountInput } from '../../domain/accounts/account.types'
import type { CurrencyCode } from '../../domain/money/money.types'
import { parseAmountToMinorUnits } from '../shared/money-input.utils'

interface AccountFormProps {
  establishedCurrency: CurrencyCode | null
  onCreateAccount: (input: CreateAccountInput) => Promise<unknown>
}

const accountTypes: { value: AccountType; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'debit_card', label: 'Debit card' },
  { value: 'bank_account', label: 'Bank account' },
  { value: 'savings', label: 'Savings' },
]

function AccountForm({ establishedCurrency, onCreateAccount }: AccountFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('debit_card')
  const [currency, setCurrency] = useState<'USD' | 'EUR'>('USD')
  const [openingBalance, setOpeningBalance] = useState('')

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage(null)
    setSuccessMessage(null)

    const amountMinor = parseAmountToMinorUnits(openingBalance)

    if (name.trim().length === 0) {
      setErrorMessage('Enter an account name.')
      return
    }

    if (amountMinor === null) {
      setErrorMessage('Enter a valid opening balance.')
      return
    }

    setIsSaving(true)

    try {
      await onCreateAccount({
        name: name.trim(),
        type,
        currency: establishedCurrency ?? currency,
        openingBalanceMinor: amountMinor,
      })

      setName('')
      setType('debit_card')
      setCurrency('USD')
      setOpeningBalance('')
      setSuccessMessage('Account created successfully.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while creating the account.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const inputClassName =
    'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Add account</h2>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="account-name" className="block text-sm font-medium text-slate-700">
            Account name
          </label>
          <input
            id="account-name"
            type="text"
            className={inputClassName}
            placeholder="e.g. Main account"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="account-type" className="block text-sm font-medium text-slate-700">
            Account type
          </label>
          <select
            id="account-type"
            className={inputClassName}
            value={type}
            onChange={(event) => setType(event.target.value as AccountType)}
            disabled={isSaving}
          >
            {accountTypes.map((accountType) => (
              <option key={accountType.value} value={accountType.value}>
                {accountType.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="account-currency" className="block text-sm font-medium text-slate-700">
            Currency
          </label>
          <select
            id="account-currency"
            className={inputClassName}
            value={establishedCurrency ?? currency}
            onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
            disabled={isSaving || establishedCurrency !== null}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="account-opening-balance"
            className="block text-sm font-medium text-slate-700"
          >
            Opening balance
          </label>
          <input
            id="account-opening-balance"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 1000.00"
            className={inputClassName}
            value={openingBalance}
            onChange={(event) => setOpeningBalance(event.target.value)}
            required
            disabled={isSaving}
          />
          <p className="mt-1 text-xs text-slate-500">
            Use a period as the decimal separator. Zero is allowed.
          </p>
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
          {isSaving ? 'Saving...' : 'Add account'}
        </button>
      </form>
    </section>
  )
}

export default AccountForm
