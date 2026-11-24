import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Budget } from '../../domain/budgets/budget.types'
import type { Category } from '../../domain/categories/category.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import type { UpdateBudgetInput } from '../../services/budgets/budget.service.types'

import BudgetList from './BudgetList'

const groceriesCategory: Category = {
  id: 'category-1',
  name: 'Groceries',
  type: 'expense',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
}

const transportCategory: Category = {
  id: 'category-2',
  name: 'Transport',
  type: 'expense',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
}

const groceriesBudget: Budget = {
  id: 'budget-1',
  categoryId: 'category-1',
  year: 2026,
  month: 11,
  limitMinor: 50000,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
}

const transportBudget: Budget = {
  id: 'budget-2',
  categoryId: 'category-2',
  year: 2026,
  month: 10,
  limitMinor: 20000,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
}

const groceriesExpense: Transaction = {
  id: 'transaction-1',
  type: 'expense',
  amountMinor: 25000,
  currency: 'USD',
  description: 'Weekly groceries',
  categoryId: 'category-1',
  accountId: 'account-1',
  destinationAccountId: null,
  date: '2026-11-10',
  createdAt: '2026-11-10T10:00:00.000Z',
  updatedAt: '2026-11-10T10:00:00.000Z',
}

const transportExpense: Transaction = {
  id: 'transaction-2',
  type: 'expense',
  amountMinor: 22000,
  currency: 'USD',
  description: 'Monthly transport',
  categoryId: 'category-2',
  accountId: 'account-1',
  destinationAccountId: null,
  date: '2026-10-12',
  createdAt: '2026-10-12T10:00:00.000Z',
  updatedAt: '2026-10-12T10:00:00.000Z',
}

function renderBudgetList({
  budgets = [groceriesBudget],
  categories = [groceriesCategory],
  transactions = [groceriesExpense],
  currency = 'USD',
  onUpdateBudget,
  onDeleteBudget,
}: {
  budgets?: Budget[]
  categories?: Category[]
  transactions?: Transaction[]
  currency?: 'USD' | 'EUR' | null
  onUpdateBudget?: (id: string, input: UpdateBudgetInput) => Promise<Budget>
  onDeleteBudget?: (id: string) => Promise<void>
} = {}) {
  const updateBudget =
    onUpdateBudget ??
    vi.fn(async (id: string, input: UpdateBudgetInput): Promise<Budget> => {
      const existingBudget = budgets.find((budget) => budget.id === id)

      if (!existingBudget) {
        throw new Error('Budget not found.')
      }

      return { ...existingBudget, ...input }
    })

  const deleteBudget = onDeleteBudget ?? vi.fn(async () => undefined)

  render(
    <BudgetList
      budgets={budgets}
      categories={categories}
      transactions={transactions}
      currency={currency}
      onUpdateBudget={updateBudget}
      onDeleteBudget={deleteBudget}
    />,
  )
}

describe('BudgetList', () => {
  it('shows an empty state when there are no budgets', () => {
    renderBudgetList({ budgets: [] })

    expect(screen.getByText('No budgets yet.')).toBeInTheDocument()
    expect(screen.getByText('Create a budget to start planning your spending.')).toBeInTheDocument()
  })

  it('displays the category, period, and spending limit', () => {
    renderBudgetList()

    expect(screen.getByRole('heading', { name: 'Groceries' })).toBeInTheDocument()
    expect(screen.getByText('November 2026')).toBeInTheDocument()
    expect(screen.getByText('$500.00')).toBeInTheDocument()
  })

  it('calculates and displays spent and remaining amounts', () => {
    renderBudgetList()

    expect(screen.getByText('Spent: $250.00')).toBeInTheDocument()
    expect(screen.getByText('Remaining: $250.00')).toBeInTheDocument()
    expect(screen.getByText('On track')).toBeInTheDocument()
    expect(screen.getByText('50.0% used')).toBeInTheDocument()
  })

  it('shows a near-limit status when spending reaches at least 80 percent', () => {
    const nearLimitExpense: Transaction = {
      ...groceriesExpense,
      amountMinor: 40000,
    }

    renderBudgetList({ transactions: [nearLimitExpense] })

    expect(screen.getByText('Near limit')).toBeInTheDocument()
    expect(screen.getByText('80.0% used')).toBeInTheDocument()
  })

  it('indicates overspending and caps the progress bar at 100 percent', () => {
    const overspendingExpense: Transaction = {
      ...groceriesExpense,
      amountMinor: 60000,
    }

    renderBudgetList({ transactions: [overspendingExpense] })

    expect(screen.getByText('Overspent')).toBeInTheDocument()
    expect(screen.getByText('Spent: $600.00')).toBeInTheDocument()
    expect(screen.getByText('Over budget by: $100.00')).toBeInTheDocument()
    expect(screen.getByText('120.0% used')).toBeInTheDocument()

    expect(
      screen.getByRole('progressbar', {
        name: 'Groceries spending progress for November 2026',
      }),
    ).toHaveAttribute('aria-valuenow', '100')
  })

  it('shows a fallback when the budget category is missing', () => {
    renderBudgetList({ categories: [] })

    expect(screen.getByRole('heading', { name: 'Unknown category' })).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', {
        name: 'Budget spending progress for November 2026',
      }),
    ).toBeInTheDocument()
  })

  it('sorts budgets by year and month, newest first', () => {
    renderBudgetList({
      budgets: [transportBudget, groceriesBudget],
      categories: [groceriesCategory, transportCategory],
      transactions: [groceriesExpense, transportExpense],
    })

    const budgetHeadings = screen.getAllByRole('heading', {
      level: 3,
    })

    expect(budgetHeadings.map((heading) => heading.textContent)).toEqual(['Groceries', 'Transport'])
  })

  it('formats amounts without a currency when no account currency is established', () => {
    renderBudgetList({ currency: null })

    expect(screen.getByText('500.00 (currency not set)')).toBeInTheDocument()
    expect(screen.getByText('Spent: 250.00')).toBeInTheDocument()
    expect(screen.getByText('Remaining: 250.00')).toBeInTheDocument()
  })

  it('opens the edit dialog with the selected budget details', () => {
    renderBudgetList()

    fireEvent.click(screen.getByRole('button', { name: 'Edit Groceries budget' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Edit budget' })).toBeInTheDocument()
    expect(screen.getByText('Groceries · November 2026')).toBeInTheDocument()
    expect(screen.getByLabelText('Monthly limit (USD)')).toHaveValue('500.00')
  })

  it('updates a budget and closes the dialog after a successful save', async () => {
    const onUpdateBudget = vi.fn(async (id: string, input: UpdateBudgetInput): Promise<Budget> => ({
      ...groceriesBudget,
      id,
      ...input,
    }))

    renderBudgetList({ onUpdateBudget })

    fireEvent.click(screen.getByRole('button', { name: 'Edit Groceries budget' }))

    fireEvent.change(screen.getByLabelText('Monthly limit (USD)'), {
      target: { value: '650.00' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(onUpdateBudget).toHaveBeenCalledWith('budget-1', {
        limitMinor: 65000,
      })
    })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  it('displays an error and keeps the dialog open when updating fails', async () => {
    const onUpdateBudget = vi.fn(async (): Promise<Budget> => {
      throw new Error('Unable to update budget.')
    })

    renderBudgetList({ onUpdateBudget })

    fireEvent.click(screen.getByRole('button', { name: 'Edit Groceries budget' }))

    fireEvent.change(screen.getByLabelText('Monthly limit (USD)'), {
      target: { value: '650.00' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to update budget.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes the edit dialog without saving when Cancel is clicked', () => {
    const onUpdateBudget = vi.fn(async (id: string, input: UpdateBudgetInput): Promise<Budget> => ({
      ...groceriesBudget,
      id,
      ...input,
    }))

    renderBudgetList({ onUpdateBudget })

    fireEvent.click(screen.getByRole('button', { name: 'Edit Groceries budget' }))

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onUpdateBudget).not.toHaveBeenCalled()
  })

  it('opens the deletion confirmation for the selected budget', () => {
    renderBudgetList()

    fireEvent.click(screen.getByRole('button', { name: 'Delete Groceries budget' }))

    expect(screen.getByRole('heading', { name: 'Delete this budget?' })).toBeInTheDocument()
    expect(screen.getByText(/permanently delete the budget for Groceries/)).toBeInTheDocument()
  })

  it('deletes a budget and closes the confirmation after success', async () => {
    const onDeleteBudget = vi.fn(async () => undefined)

    renderBudgetList({ onDeleteBudget })

    fireEvent.click(screen.getByRole('button', { name: 'Delete Groceries budget' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    await waitFor(() => {
      expect(onDeleteBudget).toHaveBeenCalledWith('budget-1')
    })

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Delete this budget?' })).not.toBeInTheDocument()
    })
  })

  it('displays an error and keeps the confirmation open when deletion fails', async () => {
    const onDeleteBudget = vi.fn(async () => {
      throw new Error('Unable to delete budget.')
    })

    renderBudgetList({ onDeleteBudget })

    fireEvent.click(screen.getByRole('button', { name: 'Delete Groceries budget' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to delete budget.')
    expect(screen.getByRole('heading', { name: 'Delete this budget?' })).toBeInTheDocument()
  })

  it('closes the deletion confirmation without deleting when Cancel is clicked', () => {
    const onDeleteBudget = vi.fn(async () => undefined)

    renderBudgetList({ onDeleteBudget })

    fireEvent.click(screen.getByRole('button', { name: 'Delete Groceries budget' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('heading', { name: 'Delete this budget?' })).not.toBeInTheDocument()
    expect(onDeleteBudget).not.toHaveBeenCalled()
  })

  it('disables deletion controls while a budget is being deleted', async () => {
    let resolveDeletion: (() => void) | undefined

    const onDeleteBudget = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveDeletion = resolve
        }),
    )

    renderBudgetList({ onDeleteBudget })

    fireEvent.click(screen.getByRole('button', { name: 'Delete Groceries budget' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled()

    resolveDeletion?.()

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Delete this budget?' })).not.toBeInTheDocument()
    })
  })
})
