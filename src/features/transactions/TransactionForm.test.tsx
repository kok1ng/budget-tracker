import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'

import TransactionForm from './TransactionForm'

const activeAccount: Account = {
  id: 'account-1',
  name: 'Main account',
  type: 'bank_account',
  currency: 'USD',
  openingBalanceMinor: 100000,
  createdAt: '2026-11-09T10:00:00.000Z',
  updatedAt: '2026-11-09T10:00:00.000Z',
  archivedAt: null,
}

const secondActiveAccount: Account = {
  ...activeAccount,
  id: 'account-2',
  name: 'Savings account',
  type: 'savings',
}

const archivedAccount: Account = {
  ...activeAccount,
  id: 'account-3',
  name: 'Archived account',
  archivedAt: '2026-11-08T10:00:00.000Z',
}

const testTransaction: Transaction = {
  id: 'transaction-1',
  type: 'expense',
  amountMinor: 12550,
  currency: 'USD',
  description: 'Groceries',
  categoryId: null,
  accountId: 'account-1',
  destinationAccountId: null,
  date: '2026-11-09',
  createdAt: '2026-11-09T10:00:00.000Z',
  updatedAt: '2026-11-09T10:00:00.000Z',
}

function fillValidForm() {
  fireEvent.change(screen.getByLabelText('Amount'), {
    target: { value: '125.50' },
  })

  fireEvent.change(screen.getByLabelText('Description'), {
    target: { value: 'Groceries' },
  })

  fireEvent.change(screen.getByLabelText('Account'), {
    target: { value: 'account-1' },
  })

  fireEvent.change(screen.getByLabelText('Date'), {
    target: { value: '2026-11-09' },
  })
}

function submitForm(buttonName = 'Add transaction') {
  const form = screen
    .getByRole('button', {
      name: buttonName,
    })
    .closest('form')

  if (!form) {
    throw new Error('Transaction form was not found.')
  }

  fireEvent.submit(form)
}

describe('TransactionForm', () => {
  it('renders the transaction form with default values', () => {
    render(
      <TransactionForm mode="create" accounts={[activeAccount]} onCreateTransaction={vi.fn()} />,
    )

    expect(screen.getByRole('heading', { name: 'Add transaction' })).toBeInTheDocument()

    expect(screen.getByLabelText('Transaction type')).toHaveValue('expense')
    expect(screen.getByLabelText('Amount')).toHaveValue('')
    expect(screen.getByLabelText('Description')).toHaveValue('')
    expect(screen.getByLabelText('Account')).toHaveValue('account-1')
    const dateValue = screen.getByLabelText('Date').getAttribute('value')
    expect(dateValue).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('shows only active accounts in the account selector', () => {
    render(
      <TransactionForm
        mode="create"
        accounts={[activeAccount, secondActiveAccount, archivedAccount]}
        onCreateTransaction={vi.fn()}
      />,
    )

    const accountSelect = screen.getByLabelText('Account')

    expect(accountSelect).toHaveValue('account-1')
    expect(screen.getByRole('option', { name: 'Main account' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Savings account' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Archived account' })).not.toBeInTheDocument()
  })

  it('shows an explanatory message when there are no active accounts', () => {
    render(
      <TransactionForm mode="create" accounts={[archivedAccount]} onCreateTransaction={vi.fn()} />,
    )

    expect(screen.getByRole('heading', { name: 'No active accounts' })).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'Add transaction' })).not.toBeInTheDocument()
  })

  it('creates an expense with the expected input', async () => {
    const onCreateTransaction = vi.fn().mockResolvedValue(testTransaction)

    render(
      <TransactionForm
        mode="create"
        accounts={[activeAccount]}
        onCreateTransaction={onCreateTransaction}
      />,
    )

    fillValidForm()
    submitForm()

    await waitFor(() => {
      expect(onCreateTransaction).toHaveBeenCalledWith({
        type: 'expense',
        amountMinor: 12550,
        description: 'Groceries',
        categoryId: null,
        accountId: 'account-1',
        date: '2026-11-09',
      })
    })

    expect(await screen.findByRole('status')).toHaveTextContent('Transaction created successfully.')
  })

  it('creates an income transaction when income is selected', async () => {
    const onCreateTransaction = vi.fn().mockResolvedValue({
      ...testTransaction,
      type: 'income',
    })

    render(
      <TransactionForm
        mode="create"
        accounts={[activeAccount]}
        onCreateTransaction={onCreateTransaction}
      />,
    )

    fireEvent.change(screen.getByLabelText('Transaction type'), {
      target: { value: 'income' },
    })

    fillValidForm()
    submitForm()

    await waitFor(() => {
      expect(onCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'income',
          amountMinor: 12550,
        }),
      )
    })
  })

  it('rejects zero amounts without calling the creation callback', async () => {
    const onCreateTransaction = vi.fn()

    render(
      <TransactionForm
        mode="create"
        accounts={[activeAccount]}
        onCreateTransaction={onCreateTransaction}
      />,
    )

    fillValidForm()

    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '0' },
    })

    submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent('Amount must be greater than zero.')
    expect(onCreateTransaction).not.toHaveBeenCalled()
  })

  it('rejects invalid amount formats', async () => {
    const onCreateTransaction = vi.fn()

    render(
      <TransactionForm
        mode="create"
        accounts={[activeAccount]}
        onCreateTransaction={onCreateTransaction}
      />,
    )

    fillValidForm()

    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '124,50' },
    })

    submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid amount.')
    expect(onCreateTransaction).not.toHaveBeenCalled()
  })

  it('resets the form after successful creation', async () => {
    const onCreateTransaction = vi.fn().mockResolvedValue(testTransaction)

    render(
      <TransactionForm
        mode="create"
        accounts={[activeAccount]}
        onCreateTransaction={onCreateTransaction}
      />,
    )

    fillValidForm()
    submitForm()

    await screen.findByText('Transaction created successfully.')

    expect(screen.getByLabelText('Transaction type')).toHaveValue('expense')
    expect(screen.getByLabelText('Amount')).toHaveValue('')
    expect(screen.getByLabelText('Description')).toHaveValue('')
    expect(screen.getByLabelText('Account')).toHaveValue('account-1')
  })

  it('preserves form values and displays an error after failed creation', async () => {
    const onCreateTransaction = vi
      .fn()
      .mockRejectedValue(new Error('Insufficient account balance.'))

    render(
      <TransactionForm
        mode="create"
        accounts={[activeAccount]}
        onCreateTransaction={onCreateTransaction}
      />,
    )

    fillValidForm()
    submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient account balance.')

    expect(screen.getByLabelText('Amount')).toHaveValue('125.50')
    expect(screen.getByLabelText('Description')).toHaveValue('Groceries')
    expect(screen.getByLabelText('Account')).toHaveValue('account-1')
    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-09')
  })

  it('disables the submit button while creation is pending', async () => {
    let resolveCreation: (transaction: Transaction) => void = () => {}

    const onCreateTransaction = vi.fn(
      () =>
        new Promise<Transaction>((resolve) => {
          resolveCreation = resolve
        }),
    )

    render(
      <TransactionForm
        mode="create"
        accounts={[activeAccount]}
        onCreateTransaction={onCreateTransaction}
      />,
    )

    fillValidForm()
    submitForm()

    expect(await screen.findByRole('button', { name: 'Saving...' })).toBeDisabled()

    resolveCreation(testTransaction)

    await screen.findByText('Transaction created successfully.')

    expect(screen.getByRole('button', { name: 'Add transaction' })).toBeEnabled()
  })

  it('renders the edit form with the selected transaction values', () => {
    render(
      <TransactionForm
        mode="edit"
        accounts={[activeAccount, secondActiveAccount]}
        transaction={testTransaction}
        onUpdateTransaction={vi.fn().mockResolvedValue(testTransaction)}
        onCancelEdit={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Edit transaction' })).toBeInTheDocument()

    expect(screen.getByLabelText('Transaction type')).toHaveValue('expense')
    expect(screen.getByLabelText('Amount')).toHaveValue('125.50')
    expect(screen.getByLabelText('Description')).toHaveValue('Groceries')
    expect(screen.getByLabelText('Account')).toHaveValue('account-1')
    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-09')

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('shows only active accounts when editing a transaction', () => {
    render(
      <TransactionForm
        mode="edit"
        accounts={[activeAccount, secondActiveAccount, archivedAccount]}
        transaction={testTransaction}
        onUpdateTransaction={vi.fn().mockResolvedValue(testTransaction)}
        onCancelEdit={vi.fn()}
      />,
    )

    expect(screen.getByRole('option', { name: 'Main account' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Savings account' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Archived account' })).not.toBeInTheDocument()
  })

  it('updates a transaction with the selected account', async () => {
    const onUpdateTransaction = vi.fn().mockResolvedValue({
      ...testTransaction,
      accountId: 'account-2',
      currency: 'EUR',
    })

    render(
      <TransactionForm
        mode="edit"
        accounts={[activeAccount, secondActiveAccount]}
        transaction={testTransaction}
        onUpdateTransaction={onUpdateTransaction}
        onCancelEdit={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Account'), {
      target: { value: 'account-2' },
    })

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Updated groceries' },
    })

    submitForm('Save changes')

    await waitFor(() => {
      expect(onUpdateTransaction).toHaveBeenCalledWith('transaction-1', {
        type: 'expense',
        amountMinor: 12550,
        description: 'Updated groceries',
        categoryId: null,
        accountId: 'account-2',
        date: '2026-11-09',
      })
    })

    expect(await screen.findByRole('status')).toHaveTextContent('Transaction updated successfully.')
  })

  it('preserves edited values and displays an error after failed update', async () => {
    const onUpdateTransaction = vi
      .fn()
      .mockRejectedValue(new Error('Insufficient account balance.'))

    render(
      <TransactionForm
        mode="edit"
        accounts={[activeAccount, secondActiveAccount]}
        transaction={testTransaction}
        onUpdateTransaction={onUpdateTransaction}
        onCancelEdit={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '150.00' },
    })

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Updated groceries' },
    })

    submitForm('Save changes')

    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient account balance.')

    expect(screen.getByLabelText('Amount')).toHaveValue('150.00')
    expect(screen.getByLabelText('Description')).toHaveValue('Updated groceries')
    expect(screen.getByLabelText('Account')).toHaveValue('account-1')
  })

  it('calls the cancel callback when editing is cancelled', () => {
    const onCancelEdit = vi.fn()

    render(
      <TransactionForm
        mode="edit"
        accounts={[activeAccount]}
        transaction={testTransaction}
        onUpdateTransaction={vi.fn().mockResolvedValue(testTransaction)}
        onCancelEdit={onCancelEdit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancelEdit).toHaveBeenCalledOnce()
  })
})
