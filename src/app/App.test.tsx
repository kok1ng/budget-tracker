import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { StorageError } from '../services/storage/storage.types'

import type { Category } from '../domain/categories/category.types'
import type { Budget } from '../domain/budgets/budget.types'

const repositoryMocks = vi.hoisted(() => ({
  getAllAccounts: vi.fn(),
  getAllTransactions: vi.fn(),
  getAllCategories: vi.fn(),
  getAllBudgets: vi.fn(),
}))

vi.mock('../services/storage/repositories/accounts/account.local-storage.repository', () => ({
  LocalStorageAccountRepository: class {
    getAll = repositoryMocks.getAllAccounts
  },
}))

vi.mock(
  '../services/storage/repositories/transactions/transaction.local-storage.repository',
  () => ({
    LocalStorageTransactionRepository: class {
      getAll = repositoryMocks.getAllTransactions
    },
  }),
)

const testCategory: Category = {
  id: 'category-1',
  name: 'Groceries',
  type: 'expense',
  createdAt: '2026-11-06T10:00:00.000Z',
  updatedAt: '2026-11-06T10:00:00.000Z',
}

const testBudget: Budget = {
  id: 'budget-1',
  categoryId: 'category-1',
  year: 2026,
  month: 11,
  limitMinor: 50000,
  createdAt: '2026-11-06T10:00:00.000Z',
  updatedAt: '2026-11-06T10:00:00.000Z',
}

vi.mock('../services/storage/repositories/categories/category.local-storage.repository', () => ({
  LocalStorageCategoryRepository: class {
    getAll = repositoryMocks.getAllCategories
  },
}))

vi.mock('../services/storage/repositories/budgets/budget.local-storage.repository', () => ({
  LocalStorageBudgetRepository: class {
    getAll = repositoryMocks.getAllBudgets
  },
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    repositoryMocks.getAllAccounts.mockResolvedValue([])
    repositoryMocks.getAllTransactions.mockResolvedValue([])
    repositoryMocks.getAllCategories.mockResolvedValue([])
    repositoryMocks.getAllBudgets.mockResolvedValue([])
  })

  it('renders the Dashboard page by default', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('navigates to the Transactions page', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Transactions' }))

    expect(await screen.findByRole('heading', { name: 'Transactions' })).toBeInTheDocument()
  })

  it('navigates to the Budgets page', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Budgets' }))

    expect(await screen.findByRole('heading', { name: 'Budgets' })).toBeInTheDocument()
    expect(screen.getByText('No budgets yet.')).toBeInTheDocument()
  })

  it('displays loaded budgets on the Budgets page', async () => {
    const user = userEvent.setup()

    repositoryMocks.getAllCategories.mockResolvedValue([testCategory])
    repositoryMocks.getAllBudgets.mockResolvedValue([testBudget])

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Budgets' }))

    expect(await screen.findByRole('heading', { name: 'Groceries' })).toBeInTheDocument()
    expect(screen.getByText('November 2026')).toBeInTheDocument()
    expect(screen.getByText('500.00 (currency not set)')).toBeInTheDocument()
  })

  it('keeps navigation available after changing pages', async () => {
    const user = userEvent.setup()

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Transactions' }))

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Categories' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Budgets' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('shows a loading indicator while financial data is loading', () => {
    repositoryMocks.getAllAccounts.mockReturnValue(new Promise(() => {}))
    repositoryMocks.getAllTransactions.mockReturnValue(new Promise(() => {}))

    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('Loading financial data...')
  })

  it('shows an error when financial data cannot be loaded', async () => {
    repositoryMocks.getAllAccounts.mockRejectedValue(
      new StorageError('STORAGE_READ_FAILED', 'Failed to read stored data.'),
    )

    render(<App />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        name: 'Unable to load your financial data',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Failed to read stored data.')).toBeInTheDocument()
    expect(screen.getByText('Error code: STORAGE_READ_FAILED')).toBeInTheDocument()
  })
})
