import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'

import TransactionsPage from './TransactionsPage'

afterEach(() => {
  vi.restoreAllMocks()
})

const testAccount: Account = {
  id: 'account-1',
  name: 'Visa card',
  type: 'debit_card',
  currency: 'USD',
  openingBalanceMinor: 100000,
  createdAt: '2026-11-09T10:00:00.000Z',
  updatedAt: '2026-11-09T10:00:00.000Z',
  archivedAt: null,
}

const secondTestAccount: Account = {
  ...testAccount,
  id: 'account-2',
  name: 'Savings account',
}

const archivedAccount: Account = {
  ...testAccount,
  id: 'account-archived',
  name: 'Archived card',
  archivedAt: '2026-11-08T10:00:00.000Z',
}

const testExpense: Transaction = {
  id: 'transaction-1',
  type: 'expense',
  amountMinor: 10000,
  currency: 'USD',
  description: 'Groceries',
  categoryId: null,
  accountId: 'account-1',
  destinationAccountId: null,
  date: '2026-11-09',
  createdAt: '2026-11-09T10:00:00.000Z',
  updatedAt: '2026-11-09T10:00:00.000Z',
}

const testTransfer: Transaction = {
  id: 'transaction-transfer',
  type: 'transfer',
  amountMinor: 5000,
  currency: 'USD',
  description: 'Savings transfer',
  categoryId: null,
  accountId: 'account-1',
  destinationAccountId: 'account-2',
  date: '2026-11-09',
  createdAt: '2026-11-09T10:00:00.000Z',
  updatedAt: '2026-11-09T10:00:00.000Z',
}

describe('TransactionsPage', () => {
  it('displays an expense with the correct formatted amount and minus sign', () => {
    render(
      <TransactionsPage
        transactions={[testExpense]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Visa card')
    expect(screen.getByText('−$100.00')).toBeInTheDocument()
  })

  it('displays an income with the correct formatted amount and plus sign', () => {
    const testIncome: Transaction = {
      ...testExpense,
      id: 'transaction-2',
      type: 'income',
      amountMinor: 250000,
      description: 'Salary',
    }

    render(
      <TransactionsPage
        transactions={[testIncome]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.getByText('+$2,500.00')).toBeInTheDocument()
  })

  it('displays an empty-state message when there are no transactions', () => {
    render(
      <TransactionsPage
        transactions={[]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    expect(screen.getByText('No transactions yet.')).toBeInTheDocument()
    expect(screen.getByText('Your transactions will appear here.')).toBeInTheDocument()
  })

  it('opens the edit form with the selected transaction values', () => {
    render(
      <TransactionsPage
        transactions={[testExpense]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn().mockResolvedValue(testExpense)}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByRole('heading', { name: 'Edit transaction' })).toBeInTheDocument()
    expect(
      screen.getByLabelText('Transaction type', {
        selector: '#transaction-type',
      }),
    ).toHaveValue('expense')
    expect(screen.getByLabelText('Amount')).toHaveValue('100.00')
    expect(screen.getByLabelText('Description')).toHaveValue('Groceries')
    expect(
      screen.getByLabelText('Account', {
        selector: '#transaction-account',
      }),
    ).toHaveValue('account-1')
    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-09')
  })

  it('updates the selected transaction and returns to creation mode', async () => {
    const onUpdateTransaction = vi.fn().mockResolvedValue({
      ...testExpense,
      description: 'Updated groceries',
    })

    render(
      <TransactionsPage
        transactions={[testExpense]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={onUpdateTransaction}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))

    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Updated groceries' },
    })

    const form = screen.getByRole('button', { name: 'Save changes' }).closest('form')

    if (!form) {
      throw new Error('Edit transaction form was not found.')
    }

    fireEvent.submit(form)

    await waitFor(() => {
      expect(onUpdateTransaction).toHaveBeenCalledWith('transaction-1', {
        type: 'expense',
        amountMinor: 10000,
        description: 'Updated groceries',
        categoryId: null,
        accountId: 'account-1',
        date: '2026-11-09',
      })
    })

    expect(await screen.findByRole('heading', { name: 'Add transaction' })).toBeInTheDocument()

    expect(screen.queryByRole('heading', { name: 'Edit transaction' })).not.toBeInTheDocument()
  })

  it('cancels editing without calling the update callback', () => {
    const onUpdateTransaction = vi.fn()

    render(
      <TransactionsPage
        transactions={[testExpense]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={onUpdateTransaction}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('heading', { name: 'Add transaction' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Edit transaction' })).not.toBeInTheDocument()
    expect(onUpdateTransaction).not.toHaveBeenCalled()
  })

  it('disables editing transactions belonging to archived accounts', () => {
    const archivedExpense: Transaction = {
      ...testExpense,
      accountId: archivedAccount.id,
    }

    render(
      <TransactionsPage
        transactions={[archivedExpense]}
        accounts={[archivedAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
  })

  it('deletes a transaction after confirmation', async () => {
    const onDeleteTransaction = vi.fn().mockResolvedValue(undefined)
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <TransactionsPage
        transactions={[testExpense]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={onDeleteTransaction}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete "Groceries"?')

    await waitFor(() => {
      expect(onDeleteTransaction).toHaveBeenCalledWith('transaction-1')
    })

    expect(onDeleteTransaction).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('does not delete a transaction when confirmation is cancelled', () => {
    const onDeleteTransaction = vi.fn()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(
      <TransactionsPage
        transactions={[testExpense]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={onDeleteTransaction}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(confirmSpy).toHaveBeenCalledTimes(1)
    expect(onDeleteTransaction).not.toHaveBeenCalled()
    expect(screen.getByText('Groceries')).toBeInTheDocument()
  })

  it('displays an error and keeps the transaction visible when deletion fails', async () => {
    const onDeleteTransaction = vi.fn().mockRejectedValue(new Error('Insufficient balance'))

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <TransactionsPage
        transactions={[testExpense]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={onDeleteTransaction}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient balance')
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(onDeleteTransaction).toHaveBeenCalledWith('transaction-1')
  })

  it('allows deleting transactions belonging to archived accounts', async () => {
    const archivedExpense: Transaction = {
      ...testExpense,
      accountId: archivedAccount.id,
    }

    const onDeleteTransaction = vi.fn().mockResolvedValue(undefined)

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <TransactionsPage
        transactions={[archivedExpense]}
        accounts={[archivedAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={onDeleteTransaction}
      />,
    )

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => {
      expect(onDeleteTransaction).toHaveBeenCalledWith('transaction-1')
    })
  })

  it('displays all transactions with the newest first by default', () => {
    const olderExpense: Transaction = {
      ...testExpense,
      id: 'transaction-older',
      description: 'Coffee',
      date: '2026-11-08',
    }

    render(
      <TransactionsPage
        transactions={[olderExpense, testExpense]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    const transactionItems = screen.getAllByRole('listitem')

    expect(transactionItems).toHaveLength(2)
    expect(transactionItems[0]).toHaveTextContent('Groceries')
    expect(transactionItems[1]).toHaveTextContent('Coffee')
  })

  it('displays only income transactions when the income filter is selected', () => {
    const incomeTransaction: Transaction = {
      ...testExpense,
      id: 'transaction-income',
      type: 'income',
      description: 'Salary',
    }

    render(
      <TransactionsPage
        transactions={[testExpense, incomeTransaction]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.change(
      screen.getByLabelText('Transaction type', {
        selector: '#transaction-type-filter',
      }),
      {
        target: { value: 'income' },
      },
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
  })

  it('displays only expense transactions when the expense filter is selected', () => {
    const incomeTransaction: Transaction = {
      ...testExpense,
      id: 'transaction-income',
      type: 'income',
      description: 'Salary',
    }

    render(
      <TransactionsPage
        transactions={[testExpense, incomeTransaction]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.change(
      screen.getByLabelText('Transaction type', {
        selector: '#transaction-type-filter',
      }),
      {
        target: { value: 'expense' },
      },
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.queryByText('Salary')).not.toBeInTheDocument()
  })

  it('displays only transactions belonging to the selected account', () => {
    const secondAccount: Account = {
      ...testAccount,
      id: 'account-2',
      name: 'Cash',
    }

    const secondAccountTransaction: Transaction = {
      ...testExpense,
      id: 'transaction-2',
      description: 'Lunch',
      accountId: secondAccount.id,
    }

    render(
      <TransactionsPage
        transactions={[testExpense, secondAccountTransaction]}
        accounts={[testAccount, secondAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.change(
      screen.getByLabelText('Account', {
        selector: '#transaction-account-filter',
      }),
      {
        target: { value: testAccount.id },
      },
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Groceries')).toBeInTheDocument()
    expect(screen.queryByText('Lunch')).not.toBeInTheDocument()
  })

  it('allows filtering transactions by an archived account', () => {
    const archivedTransaction: Transaction = {
      ...testExpense,
      id: 'transaction-archived',
      description: 'Old purchase',
      accountId: archivedAccount.id,
    }

    render(
      <TransactionsPage
        transactions={[testExpense, archivedTransaction]}
        accounts={[testAccount, archivedAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.change(
      screen.getByLabelText('Account', {
        selector: '#transaction-account-filter',
      }),
      {
        target: { value: archivedAccount.id },
      },
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Old purchase')).toBeInTheDocument()
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
  })

  it('displays the oldest transactions first when the sort order is changed', () => {
    const olderExpense: Transaction = {
      ...testExpense,
      id: 'transaction-older',
      description: 'Coffee',
      date: '2026-11-08',
    }

    render(
      <TransactionsPage
        transactions={[testExpense, olderExpense]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Sort by date'), {
      target: { value: 'oldest' },
    })

    const transactionItems = screen.getAllByRole('listitem')

    expect(transactionItems).toHaveLength(2)
    expect(transactionItems[0]).toHaveTextContent('Coffee')
    expect(transactionItems[1]).toHaveTextContent('Groceries')
  })

  it('applies transaction type and account filters together', () => {
    const secondAccount: Account = {
      ...testAccount,
      id: 'account-2',
      name: 'Cash',
    }

    const incomeTransaction: Transaction = {
      ...testExpense,
      id: 'transaction-income',
      type: 'income',
      description: 'Salary',
    }

    const secondAccountIncome: Transaction = {
      ...incomeTransaction,
      id: 'transaction-income-2',
      description: 'Freelance work',
      accountId: secondAccount.id,
    }

    render(
      <TransactionsPage
        transactions={[testExpense, incomeTransaction, secondAccountIncome]}
        accounts={[testAccount, secondAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.change(
      screen.getByLabelText('Transaction type', {
        selector: '#transaction-type-filter',
      }),
      { target: { value: 'income' } },
    )

    fireEvent.change(
      screen.getByLabelText('Account', {
        selector: '#transaction-account-filter',
      }),
      { target: { value: testAccount.id } },
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Salary')).toBeInTheDocument()
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
    expect(screen.queryByText('Freelance work')).not.toBeInTheDocument()
  })

  it('displays a message when no transactions match the selected filters', () => {
    render(
      <TransactionsPage
        transactions={[testExpense]}
        accounts={[testAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.change(
      screen.getByLabelText('Transaction type', {
        selector: '#transaction-type-filter',
      }),
      { target: { value: 'income' } },
    )

    expect(screen.getByText('No transactions match your filters.')).toBeInTheDocument()

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('displays only transfer transactions when the transfer filter is selected', () => {
    render(
      <TransactionsPage
        transactions={[testExpense, testTransfer]}
        accounts={[testAccount, secondTestAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.change(
      screen.getByLabelText('Transaction type', {
        selector: '#transaction-type-filter',
      }),
      { target: { value: 'transfer' } },
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Savings transfer')).toBeInTheDocument()
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
  })

  it('includes transfers when filtering by their destination account', () => {
    render(
      <TransactionsPage
        transactions={[testExpense, testTransfer]}
        accounts={[testAccount, secondTestAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    fireEvent.change(
      screen.getByLabelText('Account', {
        selector: '#transaction-account-filter',
      }),
      { target: { value: 'account-2' } },
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Savings transfer')).toBeInTheDocument()
    expect(screen.queryByText('Groceries')).not.toBeInTheDocument()
  })

  it('displays both source and destination accounts for transfers', () => {
    render(
      <TransactionsPage
        transactions={[testTransfer]}
        accounts={[testAccount, secondTestAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    expect(screen.getByRole('listitem')).toHaveTextContent('Visa card → Savings account')
  })

  it('displays transfer amounts without income or expense styling', () => {
    render(
      <TransactionsPage
        transactions={[testTransfer]}
        accounts={[testAccount, secondTestAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    const amount = screen.getByText('$50.00')

    expect(amount).toBeInTheDocument()
    expect(amount).not.toHaveClass('text-green-600')
    expect(amount).not.toHaveClass('text-red-600')
  })

  it('disables editing transfers when the destination account is archived', () => {
    const transferToArchivedAccount: Transaction = {
      ...testTransfer,
      destinationAccountId: archivedAccount.id,
    }

    render(
      <TransactionsPage
        transactions={[transferToArchivedAccount]}
        accounts={[testAccount, archivedAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn()}
        onDeleteTransaction={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
  })

  it('allows editing transfers when both accounts are active', () => {
    render(
      <TransactionsPage
        transactions={[testTransfer]}
        accounts={[testAccount, secondTestAccount]}
        onCreateTransaction={vi.fn()}
        onUpdateTransaction={vi.fn().mockResolvedValue(testTransfer)}
        onDeleteTransaction={vi.fn()}
      />,
    )

    const editButton = screen.getByRole('button', { name: 'Edit' })

    expect(editButton).toBeEnabled()

    fireEvent.click(editButton)

    expect(screen.getByRole('heading', { name: 'Edit transaction' })).toBeInTheDocument()
    expect(
      screen.getByLabelText('Transaction type', {
        selector: '#transaction-type',
      }),
    ).toHaveValue('transfer')
  })
})
