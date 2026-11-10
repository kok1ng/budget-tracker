import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { Account } from '../../domain/accounts/account.types'
import AccountEditDialog from './AccountEditDialog'

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

function submitForm() {
  const form = screen.getByRole('button', { name: 'Save changes' }).closest('form')

  if (!form) {
    throw new Error('Account edit form was not found.')
  }

  fireEvent.submit(form)
}

describe('AccountEditDialog', () => {
  it('renders the selected account values', () => {
    render(
      <AccountEditDialog
        account={testAccount}
        openingBalanceEditable
        onUpdateAccount={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Edit account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Account name')).toHaveValue('Main account')
    expect(screen.getByLabelText('Account type')).toHaveValue('bank_account')
    expect(screen.getByLabelText('Currency')).toHaveValue('USD')
    expect(screen.getByLabelText('Opening balance')).toHaveValue('1000.00')
  })

  it('does not allow changing the account currency', () => {
    render(
      <AccountEditDialog
        account={testAccount}
        openingBalanceEditable
        onUpdateAccount={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Currency')).toBeDisabled()
  })

  it('disables opening balance editing when transactions are associated', () => {
    render(
      <AccountEditDialog
        account={testAccount}
        openingBalanceEditable={false}
        onUpdateAccount={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Opening balance')).toBeDisabled()

    expect(screen.getByText(/Opening balance cannot be changed/)).toBeInTheDocument()
  })

  it('updates the account with the expected values', async () => {
    const onUpdateAccount = vi.fn().mockResolvedValue(testAccount)
    const onClose = vi.fn()

    render(
      <AccountEditDialog
        account={testAccount}
        openingBalanceEditable
        onUpdateAccount={onUpdateAccount}
        onClose={onClose}
      />,
    )

    fireEvent.change(screen.getByLabelText('Account name'), {
      target: { value: 'Updated account' },
    })

    fireEvent.change(screen.getByLabelText('Account type'), {
      target: { value: 'savings' },
    })

    fireEvent.change(screen.getByLabelText('Opening balance'), {
      target: { value: '1500.50' },
    })

    submitForm()

    await waitFor(() => {
      expect(onUpdateAccount).toHaveBeenCalledWith('account-1', {
        name: 'Updated account',
        type: 'savings',
        openingBalanceMinor: 150050,
      })
    })

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not include opening balance when it is not editable', async () => {
    const onUpdateAccount = vi.fn().mockResolvedValue(testAccount)

    render(
      <AccountEditDialog
        account={testAccount}
        openingBalanceEditable={false}
        onUpdateAccount={onUpdateAccount}
        onClose={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Account name'), {
      target: { value: 'Updated account' },
    })

    submitForm()

    await waitFor(() => {
      expect(onUpdateAccount).toHaveBeenCalledWith('account-1', {
        name: 'Updated account',
        type: 'bank_account',
      })
    })
  })

  it('displays an error and keeps the dialog open when updating fails', async () => {
    const onUpdateAccount = vi.fn().mockRejectedValue(new Error('Account could not be updated.'))

    const onClose = vi.fn()

    render(
      <AccountEditDialog
        account={testAccount}
        openingBalanceEditable
        onUpdateAccount={onUpdateAccount}
        onClose={onClose}
      />,
    )

    fireEvent.change(screen.getByLabelText('Account name'), {
      target: { value: 'Updated account' },
    })

    submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent('Account could not be updated.')

    expect(screen.getByLabelText('Account name')).toHaveValue('Updated account')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls the close callback when cancelled', () => {
    const onClose = vi.fn()

    render(
      <AccountEditDialog
        account={testAccount}
        openingBalanceEditable
        onUpdateAccount={vi.fn()}
        onClose={onClose}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('rejects an invalid opening balance', async () => {
    const onUpdateAccount = vi.fn()

    render(
      <AccountEditDialog
        account={testAccount}
        openingBalanceEditable
        onUpdateAccount={onUpdateAccount}
        onClose={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Opening balance'), {
      target: { value: 'invalid' },
    })

    submitForm()

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid opening balance.')

    expect(onUpdateAccount).not.toHaveBeenCalled()
  })
})
