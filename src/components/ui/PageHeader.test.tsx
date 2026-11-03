import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PageHeader from './PageHeader'

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Dashboard" />)

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('renders the description when provided', () => {
    render(<PageHeader title="Dashboard" description="Here's an overview of your finances." />)

    expect(screen.getByText("Here's an overview of your finances.")).toBeInTheDocument()
  })

  it('does not render a description when omitted', () => {
    render(<PageHeader title="Dashboard" />)

    expect(screen.queryByText("Here's an overview of your finances.")).not.toBeInTheDocument()
  })
})
