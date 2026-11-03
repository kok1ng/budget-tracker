import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import AppLayout from './AppLayout'

describe('AppLayout', () => {
  it('renders all navigation items', () => {
    const onPageChange = vi.fn()

    render(
      <AppLayout activePage="dashboard" onPageChange={onPageChange}>
        <div>Test content</div>
      </AppLayout>,
    )

    expect(screen.getByRole('button', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Transactions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Categories' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Budgets' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
  })

  it('marks the active page in navigation', () => {
    const onPageChange = vi.fn()

    render(
      <AppLayout activePage="dashboard" onPageChange={onPageChange}>
        <div>Test content</div>
      </AppLayout>,
    )

    expect(screen.getByRole('button', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    expect(screen.getByRole('button', { name: 'Transactions' })).not.toHaveAttribute('aria-current')
  })

  it('calls onPageChange when a navigation item is clicked', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <AppLayout activePage="dashboard" onPageChange={onPageChange}>
        <div>Test content</div>
      </AppLayout>,
    )

    await user.click(screen.getByRole('button', { name: 'Transactions' }))

    expect(onPageChange).toHaveBeenCalledWith('transactions')
  })

  it('renders its children', () => {
    const onPageChange = vi.fn()

    render(
      <AppLayout activePage="dashboard" onPageChange={onPageChange}>
        <div>Test content</div>
      </AppLayout>,
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })
})
