import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Category } from '../../domain/categories/category.types'
import type { Budget } from '../../domain/budgets/budget.types'

import BudgetForm from './BudgetForm'

const expenseCategory: Category = {
  id: 'category-1',
  name: 'Groceries',
  type: 'expense',
  createdAt: '2026-11-09T10:00:00.000Z',
  updatedAt: '2026-11-09T10:00:00.000Z',
}

const incomeCategory: Category = {
  id: 'category-2',
  name: 'Salary',
  type: 'income',
  createdAt: '2026-11-09T10:00:00.000Z',
  updatedAt: '2026-11-09T10:00:00.000Z',
}

function renderBudgetForm({
  categories = [expenseCategory, incomeCategory],
  budgets = [],
}: {
  categories?: Category[]
  budgets?: Budget[]
} = {}) {
  const onCreateBudget = vi.fn().mockResolvedValue({
    id: 'budget-1',
    categoryId: 'category-1',
    year: 2026,
    month: 11,
    limitMinor: 25000,
    createdAt: '2026-11-24T10:00:00.000Z',
    updatedAt: '2026-11-24T10:00:00.000Z',
  } satisfies Budget)

  render(
    <BudgetForm
      categories={categories}
      budgets={budgets}
      currency="USD"
      onCreateBudget={onCreateBudget}
    />,
  )

  return { onCreateBudget }
}

describe('BudgetForm', () => {
  it('renders expense categories but excludes income categories', () => {
    renderBudgetForm()

    const categorySelect = screen.getByLabelText('Expense category')

    expect(categorySelect).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Salary' })).not.toBeInTheDocument()
  })

  it('creates a budget with the selected category, month, and amount', async () => {
    const { onCreateBudget } = renderBudgetForm()

    const currentPeriod = (screen.getByLabelText('Budget month') as HTMLInputElement).value
    const [year, month] = currentPeriod.split('-').map(Number)

    fireEvent.change(screen.getByLabelText('Expense category'), {
      target: { value: 'category-1' },
    })
    fireEvent.change(screen.getByLabelText('Monthly limit (USD)'), {
      target: { value: '250.00' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create budget' }))

    await waitFor(() => {
      expect(onCreateBudget).toHaveBeenCalledWith({
        categoryId: 'category-1',
        year,
        month,
        limitMinor: 25000,
      })
    })

    expect(screen.getByRole('status')).toHaveTextContent('Budget created successfully.')
    expect(screen.getByLabelText('Monthly limit (USD)')).toHaveValue('')
  })

  it('displays a validation error when the amount is invalid', async () => {
    const { onCreateBudget } = renderBudgetForm()

    fireEvent.change(screen.getByLabelText('Expense category'), {
      target: { value: 'category-1' },
    })
    fireEvent.change(screen.getByLabelText('Monthly limit (USD)'), {
      target: { value: '0' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create budget' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter a valid amount greater than zero.',
    )
    expect(onCreateBudget).not.toHaveBeenCalled()
  })

  it('prevents creating a duplicate budget for the same category and month', () => {
    const existingBudget: Budget = {
      id: 'budget-existing',
      categoryId: 'category-1',
      year: 2026,
      month: 11,
      limitMinor: 30000,
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    }

    renderBudgetForm({ budgets: [existingBudget] })

    fireEvent.change(screen.getByLabelText('Expense category'), {
      target: { value: 'category-1' },
    })

    fireEvent.change(screen.getByLabelText('Budget month'), {
      target: { value: '2026-11' },
    })

    expect(screen.getByRole('status')).toHaveTextContent(
      'A budget already exists for Groceries in this month.',
    )
    expect(screen.getByRole('button', { name: 'Create budget' })).toBeDisabled()
  })

  it('displays an error when budget creation fails', async () => {
    const { onCreateBudget } = renderBudgetForm()

    onCreateBudget.mockRejectedValueOnce(
      new Error('A budget already exists for this category and month.'),
    )

    fireEvent.change(screen.getByLabelText('Expense category'), {
      target: { value: 'category-1' },
    })
    fireEvent.change(screen.getByLabelText('Monthly limit (USD)'), {
      target: { value: '250.00' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Create budget' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A budget already exists for this category and month.',
    )
  })

  it('shows guidance and disables creation when there are no expense categories', () => {
    renderBudgetForm({ categories: [incomeCategory] })

    expect(
      screen.getByText('Create an expense category before setting a budget.'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Expense category')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Create budget' })).toBeDisabled()
  })
})
