import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Account } from '../../domain/accounts/account.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import AccountsPage from './AccountsPage'

const testAccount: Account = {
  id: 'account-1',
  name: 'Main account',
  type: 'bank_account',
  currency: 'USD',
  openingBalanceMinor: 100000,
  createdAt: '2026-11-09T10:00:00.000Z',
  updatedAt: '2026-11-09T10:00:00.000Z',
  archivedAt: null,
}

const archivedAccount: Account = {
  ...testAccount,
  id: 'account-2',
  name: 'Archived account',
  archivedAt: '2026-11-10T10:00:00.000Z',
}

const testTransaction: Transaction = {
  id: 'transaction-1',
  type: 'expense',
  amountMinor: 1000,
  currency: 'USD',
  description: 'Test transaction',
  categoryId: null,
  accountId: 'account-1',
  destinationAccountId: null,
  date: '2026-11-10',
  createdAt: '2026-11-10T10:00:00.000Z',
  updatedAt: '2026-11-10T10:00:00.000Z',
}

function renderAccountsPage(accounts: Account[] = [testAccount], transactions: Transaction[] = []) {
  return render(
    <AccountsPage
      accounts={accounts}
      transactions={transactions}
      onCreateAccount={vi.fn().mockResolvedValue(testAccount)}
      onUpdateAccount={vi.fn().mockResolvedValue(testAccount)}
      onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
      onArchiveAccount={vi.fn().mockResolvedValue(testAccount)}
      onRestoreAccount={vi.fn().mockResolvedValue(testAccount)}
    />,
  )
}

function openEditDialog() {
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
  return screen.getByRole('dialog')
}

describe('AccountsPage', () => {
  it('shows the edit button only for active accounts', () => {
    renderAccountsPage([testAccount, archivedAccount])

    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
  })

  it('opens the edit dialog for the selected account', () => {
    renderAccountsPage()

    const dialog = openEditDialog()

    expect(within(dialog).getByLabelText('Account name')).toHaveValue('Main account')
  })

  it('disables opening balance editing when the account is a transaction source', () => {
    renderAccountsPage([testAccount], [testTransaction])

    const dialog = openEditDialog()

    expect(within(dialog).getByLabelText('Opening balance')).toBeDisabled()
  })

  it('disables opening balance editing when the account is a transaction destination', () => {
    const transferTransaction: Transaction = {
      ...testTransaction,
      id: 'transaction-2',
      type: 'transfer',
      accountId: 'another-account',
      destinationAccountId: 'account-1',
    }

    renderAccountsPage([testAccount], [transferTransaction])

    const dialog = openEditDialog()

    expect(within(dialog).getByLabelText('Opening balance')).toBeDisabled()
  })

  it('allows opening balance editing when the account has no associated transactions', () => {
    renderAccountsPage()

    const dialog = openEditDialog()

    expect(within(dialog).getByLabelText('Opening balance')).toBeEnabled()
  })

  it('allows opening balance editing after associated transactions are removed', () => {
    const { rerender } = render(
      <AccountsPage
        accounts={[testAccount]}
        transactions={[testTransaction]}
        onCreateAccount={vi.fn().mockResolvedValue(testAccount)}
        onUpdateAccount={vi.fn().mockResolvedValue(testAccount)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        onArchiveAccount={vi.fn().mockResolvedValue(testAccount)}
        onRestoreAccount={vi.fn().mockResolvedValue(testAccount)}
      />,
    )

    const dialog = openEditDialog()

    expect(within(dialog).getByLabelText('Opening balance')).toBeDisabled()

    rerender(
      <AccountsPage
        accounts={[testAccount]}
        transactions={[]}
        onCreateAccount={vi.fn().mockResolvedValue(testAccount)}
        onUpdateAccount={vi.fn().mockResolvedValue(testAccount)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        onArchiveAccount={vi.fn().mockResolvedValue(testAccount)}
        onRestoreAccount={vi.fn().mockResolvedValue(testAccount)}
      />,
    )

    expect(within(screen.getByRole('dialog')).getByLabelText('Opening balance')).toBeEnabled()
  })

  it('disables archiving when an account has a remaining balance', () => {
    renderAccountsPage()

    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled()
  })

  it('archives an account when its balance is zero', async () => {
    const zeroBalanceAccount: Account = {
      ...testAccount,
      openingBalanceMinor: 0,
    }

    const onArchiveAccount = vi.fn().mockResolvedValue({
      ...zeroBalanceAccount,
      archivedAt: '2026-11-10T12:00:00.000Z',
    })

    render(
      <AccountsPage
        accounts={[zeroBalanceAccount]}
        transactions={[]}
        onCreateAccount={vi.fn().mockResolvedValue(zeroBalanceAccount)}
        onUpdateAccount={vi.fn().mockResolvedValue(zeroBalanceAccount)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        onArchiveAccount={onArchiveAccount}
        onRestoreAccount={vi.fn().mockResolvedValue(archivedAccount)}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Archive' }))

    await waitFor(() => {
      expect(onArchiveAccount).toHaveBeenCalledWith('account-1')
    })
  })

  it('shows restore and delete actions for archived accounts', () => {
    renderAccountsPage([archivedAccount])

    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archive' })).not.toBeInTheDocument()
  })

  it('restores an archived account', async () => {
    const onRestoreAccount = vi.fn().mockResolvedValue({
      ...archivedAccount,
      archivedAt: null,
    })

    render(
      <AccountsPage
        accounts={[archivedAccount]}
        transactions={[]}
        onCreateAccount={vi.fn().mockResolvedValue(testAccount)}
        onUpdateAccount={vi.fn().mockResolvedValue(testAccount)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        onArchiveAccount={vi.fn().mockResolvedValue(testAccount)}
        onRestoreAccount={onRestoreAccount}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }))

    await waitFor(() => {
      expect(onRestoreAccount).toHaveBeenCalledWith('account-2')
    })
  })

  it('displays an error when restoring an account fails', async () => {
    render(
      <AccountsPage
        accounts={[archivedAccount]}
        transactions={[]}
        onCreateAccount={vi.fn().mockResolvedValue(testAccount)}
        onUpdateAccount={vi.fn().mockResolvedValue(testAccount)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        onArchiveAccount={vi.fn().mockResolvedValue(testAccount)}
        onRestoreAccount={vi.fn().mockRejectedValue(new Error('Restore failed.'))}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Restore' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Restore failed.')
  })

  it('opens delete confirmation when Delete is clicked', () => {
    renderAccountsPage()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.getByRole('heading', { name: 'Delete Main account?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm delete' })).toBeInTheDocument()
  })

  it('closes delete confirmation and clears the error when Cancel is clicked', async () => {
    render(
      <AccountsPage
        accounts={[testAccount]}
        transactions={[]}
        onCreateAccount={vi.fn().mockResolvedValue(testAccount)}
        onUpdateAccount={vi.fn().mockResolvedValue(testAccount)}
        onDeleteAccount={vi.fn().mockRejectedValue(new Error('Account has transactions.'))}
        onArchiveAccount={vi.fn().mockResolvedValue(testAccount)}
        onRestoreAccount={vi.fn().mockResolvedValue(archivedAccount)}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Account has transactions.')

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('heading', { name: 'Delete Main account?' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('deletes an account after confirmation', async () => {
    const onDeleteAccount = vi.fn().mockResolvedValue(undefined)

    render(
      <AccountsPage
        accounts={[testAccount]}
        transactions={[]}
        onCreateAccount={vi.fn().mockResolvedValue(testAccount)}
        onUpdateAccount={vi.fn().mockResolvedValue(testAccount)}
        onDeleteAccount={onDeleteAccount}
        onArchiveAccount={vi.fn().mockResolvedValue(testAccount)}
        onRestoreAccount={vi.fn().mockResolvedValue(archivedAccount)}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    await waitFor(() => {
      expect(onDeleteAccount).toHaveBeenCalledWith('account-1')
    })

    expect(screen.queryByRole('heading', { name: 'Delete Main account?' })).not.toBeInTheDocument()
  })

  it('displays an error and keeps delete confirmation open when deletion fails', async () => {
    render(
      <AccountsPage
        accounts={[testAccount]}
        transactions={[]}
        onCreateAccount={vi.fn().mockResolvedValue(testAccount)}
        onUpdateAccount={vi.fn().mockResolvedValue(testAccount)}
        onDeleteAccount={vi.fn().mockRejectedValue(new Error('Account has transactions.'))}
        onArchiveAccount={vi.fn().mockResolvedValue(testAccount)}
        onRestoreAccount={vi.fn().mockResolvedValue(archivedAccount)}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Account has transactions.')
    expect(screen.getByRole('heading', { name: 'Delete Main account?' })).toBeInTheDocument()
  })

  it('allows choosing a currency when no accounts exist', () => {
    renderAccountsPage([])

    const currencySelect = screen.getByLabelText('Currency')

    expect(currencySelect).toBeEnabled()
    expect(currencySelect).toHaveValue('USD')
  })

  it('locks the currency selector to the existing account currency', () => {
    renderAccountsPage()

    const currencySelect = screen.getByLabelText('Currency')

    expect(currencySelect).toBeDisabled()
    expect(currencySelect).toHaveValue('USD')
  })

  it('uses the currency of an archived account', () => {
    const archivedEuroAccount: Account = {
      ...archivedAccount,
      currency: 'EUR',
    }

    renderAccountsPage([archivedEuroAccount])

    const currencySelect = screen.getByLabelText('Currency')

    expect(currencySelect).toBeDisabled()
    expect(currencySelect).toHaveValue('EUR')
  })

  it('submits the selected currency when creating the first account', async () => {
    const onCreateAccount = vi.fn().mockResolvedValue({
      ...testAccount,
      currency: 'EUR',
    })

    render(
      <AccountsPage
        accounts={[]}
        transactions={[]}
        onCreateAccount={onCreateAccount}
        onUpdateAccount={vi.fn().mockResolvedValue(testAccount)}
        onDeleteAccount={vi.fn().mockResolvedValue(undefined)}
        onArchiveAccount={vi.fn().mockResolvedValue(testAccount)}
        onRestoreAccount={vi.fn().mockResolvedValue(archivedAccount)}
      />,
    )

    fireEvent.change(screen.getByLabelText('Account name'), {
      target: { value: 'Euro account' },
    })

    fireEvent.change(screen.getByLabelText('Currency'), {
      target: { value: 'EUR' },
    })

    fireEvent.change(screen.getByLabelText('Opening balance'), {
      target: { value: '500.00' },
    })

    fireEvent.click(screen.getByRole('button', { name: 'Add account' }))

    await waitFor(() => {
      expect(onCreateAccount).toHaveBeenCalledWith({
        name: 'Euro account',
        type: 'debit_card',
        currency: 'EUR',
        openingBalanceMinor: 50000,
      })
    })
  })
})
