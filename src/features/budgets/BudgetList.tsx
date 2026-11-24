import type { Budget } from '../../domain/budgets/budget.types'
import type { BudgetProgress } from '../../domain/budgets/budget.calculations'
import type { Category } from '../../domain/categories/category.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import type { CurrencyCode } from '../../domain/money/money.types'
import type { UpdateBudgetInput } from '../../services/budgets/budget.service.types'

import { calculateBudgetProgress } from '../../domain/budgets/budget.calculations'
import { formatMoney } from '../../domain/money/money.utils'

import { useState } from 'react'

import BudgetEditDialog from './BudgetEditDialog'

interface BudgetListProps {
  budgets: Budget[]
  categories: Category[]
  transactions: Transaction[]
  currency: CurrencyCode | null
  onUpdateBudget: (id: string, input: UpdateBudgetInput) => Promise<Budget>
  onDeleteBudget: (id: string) => Promise<void>
}

function formatBudgetPeriod(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

function getProgressLabel(progress: BudgetProgress): string {
  if (progress.isOverspent) {
    return 'Overspent'
  }

  if (progress.usagePercentage >= 80) {
    return 'Near limit'
  }

  return 'On track'
}

function BudgetList({
  budgets,
  categories,
  transactions,
  currency,
  onUpdateBudget,
  onDeleteBudget,
}: BudgetListProps) {
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null)

  async function handleDeleteBudget() {
    if (budgetToDelete === null) {
      return
    }

    setDeleteErrorMessage(null)
    setIsDeleting(true)

    try {
      await onDeleteBudget(budgetToDelete.id)
      setBudgetToDelete(null)
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while deleting the budget.',
      )
    } finally {
      setIsDeleting(false)
    }
  }
  if (budgets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12">
        <div className="py-10 text-center">
          <p className="text-sm font-medium text-gray-900">No budgets yet.</p>
          <p className="mt-1 text-sm text-gray-500">
            Create a budget to start planning your spending.
          </p>
        </div>
      </div>
    )
  }

  const sortedBudgets = [...budgets].sort(
    (first, second) =>
      second.year - first.year ||
      second.month - first.month ||
      first.categoryId.localeCompare(second.categoryId),
  )

  return (
    <>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Your budgets</h2>

        <ul className="mt-6 divide-y divide-slate-100">
          {sortedBudgets.map((budget) => {
            const category = categories.find((item) => item.id === budget.categoryId)
            const progress = calculateBudgetProgress(budget, transactions)
            const progressWidth = Math.min(progress.usagePercentage, 100)
            const period = formatBudgetPeriod(budget.year, budget.month)

            return (
              <li key={budget.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {category?.name ?? 'Unknown category'}
                    </h3>
                    <p className="text-sm text-slate-500">{period}</p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <p className="text-sm font-semibold text-slate-900">
                      {currency !== null
                        ? formatMoney(budget.limitMinor, currency)
                        : `${(budget.limitMinor / 100).toFixed(2)} (currency not set)`}
                    </p>

                    <button
                      type="button"
                      onClick={() => setEditingBudget(budget)}
                      className="text-sm font-medium text-blue-700 hover:text-blue-800"
                      aria-label={`Edit ${category?.name ?? 'budget'} budget`}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeleteErrorMessage(null)
                        setBudgetToDelete(budget)
                      }}
                      disabled={isDeleting}
                      className="text-sm font-medium text-red-700 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={`Delete ${category?.name ?? 'budget'} budget`}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-slate-600">
                    Spent:{' '}
                    {currency !== null
                      ? formatMoney(progress.spentMinor, currency)
                      : (progress.spentMinor / 100).toFixed(2)}
                  </span>
                  <span
                    className={progress.isOverspent ? 'font-medium text-red-700' : 'text-slate-600'}
                  >
                    {progress.isOverspent ? 'Over budget by: ' : 'Remaining: '}
                    {currency !== null
                      ? formatMoney(Math.abs(progress.remainingMinor), currency)
                      : (Math.abs(progress.remainingMinor) / 100).toFixed(2)}
                  </span>
                </div>

                <div
                  className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                  aria-label={`${category?.name ?? 'Budget'} spending progress for ${period}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(progress.usagePercentage, 100)}
                >
                  <div
                    className={`h-full rounded-full ${
                      progress.isOverspent
                        ? 'bg-red-600'
                        : progress.usagePercentage >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                    }`}
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
                  <span
                    className={
                      progress.isOverspent
                        ? 'font-medium text-red-700'
                        : progress.usagePercentage >= 80
                          ? 'font-medium text-amber-700'
                          : 'text-slate-500'
                    }
                  >
                    {getProgressLabel(progress)}
                  </span>
                  <span className="text-slate-500">
                    {progress.usagePercentage.toFixed(1)}% used
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
        {editingBudget !== null && (
          <BudgetEditDialog
            budget={editingBudget}
            category={categories.find((item) => item.id === editingBudget.categoryId)}
            currency={currency}
            onUpdateBudget={onUpdateBudget}
            onClose={() => setEditingBudget(null)}
          />
        )}
        {budgetToDelete !== null && (
          <section
            aria-labelledby="delete-budget-heading"
            className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-5"
          >
            <h3 id="delete-budget-heading" className="text-lg font-semibold text-slate-900">
              Delete this budget?
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              This will permanently delete the budget for{' '}
              {categories.find((item) => item.id === budgetToDelete.categoryId)?.name ??
                'Unknown category'}{' '}
              ({formatBudgetPeriod(budgetToDelete.year, budgetToDelete.month)}). This action cannot
              be undone. Your transactions will not be affected.
            </p>

            {deleteErrorMessage !== null && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {deleteErrorMessage}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteErrorMessage(null)
                  setBudgetToDelete(null)
                }}
                disabled={isDeleting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteBudget()}
                disabled={isDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm delete'}
              </button>
            </div>
          </section>
        )}
      </section>
    </>
  )
}

export default BudgetList
