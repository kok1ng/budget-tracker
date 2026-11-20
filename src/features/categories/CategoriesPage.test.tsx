import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Category } from '../../domain/categories/category.types'

import CategoriesPage from './CategoriesPage'

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

const testCategories = [expenseCategory, incomeCategory]

function renderCategoriesPage(categories: Category[] = testCategories) {
  const onCreateCategory = vi.fn().mockResolvedValue(expenseCategory)
  const onUpdateCategory = vi.fn().mockResolvedValue(expenseCategory)
  const onDeleteCategory = vi.fn().mockResolvedValue(undefined)

  render(
    <CategoriesPage
      categories={categories}
      onCreateCategory={onCreateCategory}
      onUpdateCategory={onUpdateCategory}
      onDeleteCategory={onDeleteCategory}
    />,
  )

  return {
    onCreateCategory,
    onUpdateCategory,
    onDeleteCategory,
  }
}

describe('CategoriesPage', () => {
  it('renders both income and expense category sections', () => {
    renderCategoriesPage()

    expect(screen.getByRole('heading', { name: 'Income categories' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Expense categories' })).toBeInTheDocument()

    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('shows separate empty states when there are no categories', () => {
    renderCategoriesPage([])

    expect(screen.getByText('No income categories yet.')).toBeInTheDocument()
    expect(screen.getByText('No expense categories yet.')).toBeInTheDocument()
  })

  it('creates a category with the entered name and selected type', async () => {
    const { onCreateCategory } = renderCategoriesPage()

    fireEvent.change(screen.getByLabelText('Category name'), {
      target: { value: '  Freelance income  ' },
    })

    fireEvent.change(screen.getByLabelText('Category type'), {
      target: { value: 'income' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add category' }))

    await waitFor(() => {
      expect(onCreateCategory).toHaveBeenCalledWith({
        name: 'Freelance income',
        type: 'income',
      })
    })

    expect(screen.getByRole('status')).toHaveTextContent('Category created successfully.')
  })

  it('displays an error when category creation fails', async () => {
    const { onCreateCategory } = renderCategoriesPage()

    onCreateCategory.mockRejectedValueOnce(new Error('A category with this name already exists.'))

    fireEvent.change(screen.getByLabelText('Category name'), {
      target: { value: 'Groceries' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add category' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A category with this name already exists.',
    )
  })

  it('opens the edit dialog with the selected category values', () => {
    renderCategoriesPage()

    const expenseSection = screen.getByRole('heading', {
      name: 'Expense categories',
    }).parentElement!

    fireEvent.click(within(expenseSection).getByRole('button', { name: 'Edit' }))

    const dialog = within(screen.getByRole('dialog'))

    expect(dialog.getByLabelText('Category name')).toHaveValue('Groceries')
    expect(dialog.getByLabelText('Category type')).toHaveValue('expense')
  })

  it('updates a category with the edited values', async () => {
    const { onUpdateCategory } = renderCategoriesPage()

    const expenseSection = screen.getByRole('heading', {
      name: 'Expense categories',
    }).parentElement!

    fireEvent.click(within(expenseSection).getByRole('button', { name: 'Edit' }))

    const dialog = within(screen.getByRole('dialog'))

    fireEvent.change(dialog.getByLabelText('Category name'), {
      target: { value: 'Food' },
    })
    fireEvent.change(dialog.getByLabelText('Category type'), {
      target: { value: 'income' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(onUpdateCategory).toHaveBeenCalledWith('category-1', {
        name: 'Food',
        type: 'income',
      })
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the edit dialog open and displays an error when updating fails', async () => {
    const { onUpdateCategory } = renderCategoriesPage()

    onUpdateCategory.mockRejectedValueOnce(
      new Error('This category is already used by transactions.'),
    )

    const expenseSection = screen.getByRole('heading', {
      name: 'Expense categories',
    }).parentElement!

    fireEvent.click(within(expenseSection).getByRole('button', { name: 'Edit' }))

    const dialog = within(screen.getByRole('dialog'))

    fireEvent.change(dialog.getByLabelText('Category name'), {
      target: { value: 'Food' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This category is already used by transactions.',
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('opens the delete confirmation for the selected category', () => {
    renderCategoriesPage()

    const expenseSection = screen.getByRole('heading', {
      name: 'Expense categories',
    }).parentElement

    expect(expenseSection).not.toBeNull()

    fireEvent.click(within(expenseSection!).getByRole('button', { name: 'Delete' }))

    expect(screen.getByRole('heading', { name: 'Delete Groceries?' })).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Confirm delete' })).toBeInTheDocument()
  })

  it('deletes the selected category and closes the confirmation', async () => {
    const { onDeleteCategory } = renderCategoriesPage()

    const expenseSection = screen.getByRole('heading', {
      name: 'Expense categories',
    }).parentElement

    expect(expenseSection).not.toBeNull()

    fireEvent.click(within(expenseSection!).getByRole('button', { name: 'Delete' }))

    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    await waitFor(() => {
      expect(onDeleteCategory).toHaveBeenCalledWith('category-1')
    })

    expect(screen.queryByRole('heading', { name: 'Delete Groceries?' })).not.toBeInTheDocument()
  })

  it('keeps the delete confirmation open and displays an error when deletion fails', async () => {
    const onDeleteCategory = vi
      .fn()
      .mockRejectedValue(new Error('Category is used by existing transactions.'))

    render(
      <CategoriesPage
        categories={testCategories}
        onCreateCategory={vi.fn().mockResolvedValue(expenseCategory)}
        onUpdateCategory={vi.fn().mockResolvedValue(expenseCategory)}
        onDeleteCategory={onDeleteCategory}
      />,
    )

    const expenseSection = screen.getByRole('heading', {
      name: 'Expense categories',
    }).parentElement

    expect(expenseSection).not.toBeNull()

    fireEvent.click(within(expenseSection!).getByRole('button', { name: 'Delete' }))

    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Category is used by existing transactions.',
    )

    expect(screen.getByRole('heading', { name: 'Delete Groceries?' })).toBeInTheDocument()
  })
})
