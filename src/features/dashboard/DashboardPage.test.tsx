import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'

import DashboardPage from './DashboardPage'

const mainAccount: Account = {
  id: 'account-1',
  name: 'Visa card',
  type: 'debit_card',
  currency: 'USD',
  openingBalanceMinor: 100000,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  archivedAt: null,
}

const savingsAccount: Account = {
  ...mainAccount,
  id: 'account-2',
  name: 'Savings account',
  openingBalanceMinor: 50000,
}

const archivedAccount: Account = {
  ...mainAccount,
  id: 'account-3',
  name: 'Archived card',
  archivedAt: '2026-11-10T10:00:00.000Z',
}

function createTransaction(
  overrides: Partial<Transaction> & Pick<Transaction, 'id' | 'date'>,
): Transaction {
  return {
    type: 'income',
    amountMinor: 10000,
    currency: 'USD',
    description: 'Test transaction',
    categoryId: null,
    accountId: mainAccount.id,
    destinationAccountId: null,
    createdAt: `${overrides.date}T10:00:00.000Z`,
    updatedAt: `${overrides.date}T10:00:00.000Z`,
    ...overrides,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 10, 13, 12, 0, 0))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('DashboardPage', () => {
  it('displays the current balance and monthly financial metrics', () => {
    const transactions = [
      createTransaction({
        id: 'income-1',
        type: 'income',
        amountMinor: 20000,
        description: 'Salary',
        date: '2026-11-05',
      }),
      createTransaction({
        id: 'expense-1',
        type: 'expense',
        amountMinor: 5000,
        description: 'Groceries',
        date: '2026-11-08',
      }),
    ]

    render(
      <DashboardPage accounts={[mainAccount]} transactions={transactions} onPageChange={vi.fn()} />,
    )

    expect(screen.getByText('Total balance')).toBeInTheDocument()
    expect(screen.getAllByText('$1,150.00')).toHaveLength(2)
    expect(screen.getByText('$200.00')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText('$150.00')).toBeInTheDocument()
  })

  it('displays zero amounts without a currency when no accounts exist', () => {
    render(<DashboardPage accounts={[]} transactions={[]} onPageChange={vi.fn()} />)

    expect(screen.getByText('No accounts yet')).toBeInTheDocument()
    expect(screen.getAllByText('0.00')).toHaveLength(4)
    expect(screen.getByText('No transactions yet.')).toBeInTheDocument()
  })

  it('displays opening balances when accounts exist but there are no transactions', () => {
    render(<DashboardPage accounts={[mainAccount]} transactions={[]} onPageChange={vi.fn()} />)

    expect(screen.getAllByText('$1,000.00')).toHaveLength(2)
    expect(screen.getByText('No transactions yet.')).toBeInTheDocument()
  })

  it('excludes archived accounts from the account overview and total balance', () => {
    render(<DashboardPage accounts={[archivedAccount]} transactions={[]} onPageChange={vi.fn()} />)

    expect(screen.getByText('No active accounts.')).toBeInTheDocument()
    expect(screen.queryByText('Archived card')).not.toBeInTheDocument()
    expect(screen.getAllByText('$0.00').length).toBeGreaterThan(0)
  })

  it('shows transfer details without treating the transfer as income or expense', () => {
    const transfer = createTransaction({
      id: 'transfer-1',
      type: 'transfer',
      amountMinor: 5000,
      description: 'Savings transfer',
      accountId: mainAccount.id,
      destinationAccountId: savingsAccount.id,
      date: '2026-11-12',
    })

    render(
      <DashboardPage
        accounts={[mainAccount, savingsAccount]}
        transactions={[transfer]}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getByText('Savings transfer')).toBeInTheDocument()

    const transferRow = screen.getByText('Savings transfer').closest('li')

    expect(transferRow).toHaveTextContent('Visa card')
    expect(transferRow).toHaveTextContent('Savings account')
    expect(transferRow).toHaveTextContent('$50.00')

    expect(screen.getAllByText('$0.00')).toHaveLength(3)
  })

  it('navigates to the transactions page when View all is clicked', () => {
    const onPageChange = vi.fn()

    render(<DashboardPage accounts={[mainAccount]} transactions={[]} onPageChange={onPageChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'View all' }))

    expect(onPageChange).toHaveBeenCalledWith('transactions')
  })

  it('navigates to account management when Manage accounts is clicked', () => {
    const onPageChange = vi.fn()

    render(<DashboardPage accounts={[]} transactions={[]} onPageChange={onPageChange} />)

    fireEvent.click(screen.getAllByRole('button', { name: 'Manage accounts' })[0])

    expect(onPageChange).toHaveBeenCalledWith('accounts')
  })
})
