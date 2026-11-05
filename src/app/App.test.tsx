import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { StorageError } from '../services/storage/storage.types'

const repositoryMocks = vi.hoisted(() => ({
  getAllAccounts: vi.fn(),
  getAllTransactions: vi.fn(),
}))

vi.mock('../services/storage/repositories/account.local-storage.repository', () => ({
  LocalStorageAccountRepository: class {
    getAll = repositoryMocks.getAllAccounts
  },
}))

vi.mock('../services/storage/repositories/transaction.local-storage.repository', () => ({
  LocalStorageTransactionRepository: class {
    getAll = repositoryMocks.getAllTransactions
  },
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    repositoryMocks.getAllAccounts.mockResolvedValue([])
    repositoryMocks.getAllTransactions.mockResolvedValue([])
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
