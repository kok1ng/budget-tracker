import { useState, type FormEvent } from 'react'

import type { Account, AccountType } from '../../domain/accounts/account.types'
import { parseAmountToMinorUnits } from '../shared/money-input.utils'
import type { UpdateAccountInput } from '../../services/accounts/account.service.types'

interface AccountEditDialogProps {
  account: Account
  openingBalanceEditable: boolean
  onUpdateAccount: (id: string, input: UpdateAccountInput) => Promise<Account>
  onClose: () => void
}

function formatMinorUnitsForInput(amountMinor: number): string {
  const wholeUnits = Math.floor(amountMinor / 100)
  const fractionalUnits = String(amountMinor % 100).padStart(2, '0')

  return `${wholeUnits}.${fractionalUnits}`
}

function AccountEditDialog({
  account,
  openingBalanceEditable,
  onUpdateAccount,
  onClose,
}: AccountEditDialogProps) {
  const [name, setName] = useState(account.name)
  const [type, setType] = useState<AccountType>(account.type)
  const [openingBalance, setOpeningBalance] = useState(
    formatMinorUnitsForInput(account.openingBalanceMinor),
  )

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
      setErrorMessage('Account name is required.')
      return
    }

    const input: UpdateAccountInput = {
      name: trimmedName,
      type,
    }

    if (openingBalanceEditable) {
      const openingBalanceMinor = parseAmountToMinorUnits(openingBalance)

      if (openingBalanceMinor === null) {
        setErrorMessage('Enter a valid opening balance.')
        return
      }

      input.openingBalanceMinor = openingBalanceMinor
    }

    setIsSaving(true)

    try {
      await onUpdateAccount(account.id, input)
      onClose()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while updating the account.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const inputClassName =
    'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-account-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="edit-account-title" className="text-lg font-semibold text-slate-900">
          Edit account
        </h2>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="edit-account-name" className="block text-sm font-medium text-slate-700">
              Account name
            </label>
            <input
              id="edit-account-name"
              type="text"
              className={inputClassName}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label htmlFor="edit-account-type" className="block text-sm font-medium text-slate-700">
              Account type
            </label>
            <select
              id="edit-account-type"
              className={inputClassName}
              value={type}
              onChange={(event) => setType(event.target.value as AccountType)}
              disabled={isSaving}
            >
              <option value="cash">Cash</option>
              <option value="debit_card">Debit card</option>
              <option value="bank_account">Bank account</option>
              <option value="savings">Savings</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="edit-account-currency"
              className="block text-sm font-medium text-slate-700"
            >
              Currency
            </label>
            <input
              id="edit-account-currency"
              type="text"
              className={inputClassName}
              value={account.currency}
              disabled
            />
            <p className="mt-1 text-xs text-slate-500">Account currency cannot be changed.</p>
          </div>

          <div>
            <label
              htmlFor="edit-account-opening-balance"
              className="block text-sm font-medium text-slate-700"
            >
              Opening balance
            </label>
            <input
              id="edit-account-opening-balance"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              className={inputClassName}
              value={openingBalance}
              onChange={(event) => setOpeningBalance(event.target.value)}
              disabled={isSaving || !openingBalanceEditable}
            />

            <p className="mt-1 text-xs text-slate-500">
              {openingBalanceEditable
                ? 'Use a period as the decimal separator.'
                : 'Opening balance cannot be changed while transactions are associated with this account.'}
            </p>
          </div>

          {errorMessage !== null && (
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default AccountEditDialog
