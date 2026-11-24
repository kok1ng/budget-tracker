import { useState } from 'react'

import type { Budget } from '../../domain/budgets/budget.types'
import type { CurrencyCode } from '../../domain/money/money.types'
import type { Category } from '../../domain/categories/category.types'
import type { UpdateBudgetInput } from '../../services/budgets/budget.service.types'

import { parseAmountToMinorUnits } from '../shared/money-input.utils'

interface BudgetEditDialogProps {
  budget: Budget
  category: Category | undefined
  currency: CurrencyCode | null
  onUpdateBudget: (id: string, input: UpdateBudgetInput) => Promise<Budget>
  onClose: () => void
}

function BudgetEditDialog({
  budget,
  category,
  currency,
  onUpdateBudget,
  onClose,
}: BudgetEditDialogProps) {
  const [amount, setAmount] = useState((budget.limitMinor / 100).toFixed(2))
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const period = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(budget.year, budget.month - 1, 1))

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const limitMinor = parseAmountToMinorUnits(amount)

    if (limitMinor === null || limitMinor <= 0) {
      setErrorMessage('Enter a valid amount greater than zero.')
      return
    }

    setIsSaving(true)

    try {
      await onUpdateBudget(budget.id, { limitMinor })
      onClose()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="budget-edit-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="budget-edit-title" className="text-lg font-semibold text-slate-900">
          Edit budget
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {category?.name ?? 'Unknown category'} · {period}
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="budget-edit-amount"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Monthly limit {currency !== null ? `(${currency})` : ''}
            </label>
            <input
              id="budget-edit-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={isSaving}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {errorMessage !== null && (
            <p role="alert" className="text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default BudgetEditDialog
