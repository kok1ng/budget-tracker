import { useState } from 'react'

import type { Category } from '../../domain/categories/category.types'
import type { CurrencyCode } from '../../domain/money/money.types'
import type { Budget } from '../../domain/budgets/budget.types'
import type { CreateBudgetInput } from '../../services/budgets/budget.service.types'

import { parseAmountToMinorUnits } from '../shared/money-input.utils'
import { getLocalDateString } from '../shared/date.utils'

interface BudgetFormProps {
  categories: Category[]
  currency: CurrencyCode | null
  budgets: Budget[]
  onCreateBudget: (input: CreateBudgetInput) => Promise<Budget>
}

function BudgetForm({ categories, currency, budgets, onCreateBudget }: BudgetFormProps) {
  const expenseCategories = categories.filter((category) => category.type === 'expense')

  const [categoryId, setCategoryId] = useState('')
  const [period, setPeriod] = useState(() => getLocalDateString().slice(0, 7))
  const [amount, setAmount] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [yearText, monthText] = period.split('-')
  const year = Number(yearText)
  const month = Number(monthText)

  const selectedCategory = expenseCategories.find((category) => category.id === categoryId)
  const duplicateBudget = budgets.some(
    (budget) => budget.categoryId === categoryId && budget.year === year && budget.month === month,
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (categoryId.length === 0) {
      setErrorMessage('Please select an expense category.')
      return
    }

    if (!/^\d{4}-\d{2}$/.test(period) || month < 1 || month > 12) {
      setErrorMessage('Please select a valid budget month.')
      return
    }

    if (duplicateBudget) {
      setErrorMessage('A budget already exists for this category and month.')
      return
    }

    const limitMinor = parseAmountToMinorUnits(amount)

    if (limitMinor === null || limitMinor <= 0) {
      setErrorMessage('Enter a valid amount greater than zero.')
      return
    }

    setIsSaving(true)

    try {
      await onCreateBudget({ categoryId, year, month, limitMinor })
      setAmount('')
      setSuccessMessage('Budget created successfully.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Create a budget</h2>
      <p className="mt-1 text-sm text-slate-500">
        Set a monthly spending limit for an expense category.
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="budget-category"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Expense category
          </label>
          <select
            id="budget-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={isSaving || expenseCategories.length === 0}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a category</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {expenseCategories.length === 0 && (
            <p className="mt-1 text-sm text-slate-500">
              Create an expense category before setting a budget.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="budget-period" className="mb-1 block text-sm font-medium text-slate-700">
            Budget month
          </label>
          <input
            id="budget-period"
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            disabled={isSaving}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="budget-amount" className="mb-1 block text-sm font-medium text-slate-700">
            Monthly limit {currency !== null ? `(${currency})` : ''}
          </label>
          <input
            id="budget-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="e.g. 250.00"
            disabled={isSaving}
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Use a period as the decimal separator.
            {currency === null && ' The currency will be established by your first account.'}
          </p>
        </div>

        {duplicateBudget && selectedCategory !== undefined && (
          <p className="text-sm text-amber-700" role="status">
            A budget already exists for {selectedCategory.name} in this month.
          </p>
        )}

        {errorMessage !== null && (
          <p role="alert" className="text-sm text-red-700">
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
          disabled={isSaving || expenseCategories.length === 0 || duplicateBudget}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Creating...' : 'Create budget'}
        </button>
      </form>
    </section>
  )
}

export default BudgetForm
