import { describe, expect, it } from 'vitest'
import type { Account } from './account.types'
import { isValidAccount } from './account.validation'

const validAccount: Account = {
  id: 'account-1',
  name: 'Main account',
  type: 'bank_account',
  currency: 'USD',
  openingBalanceMinor: 150000,
  createdAt: '2026-11-04T10:00:00.000Z',
  updatedAt: '2026-11-04T10:00:00.000Z',
  archivedAt: null,
}

describe('isValidAccount', () => {
  it('accepts a valid account', () => {
    expect(isValidAccount(validAccount)).toBe(true)
  })

  it('accepts an account with zero opening balance', () => {
    expect(isValidAccount({ ...validAccount, openingBalanceMinor: 0 })).toBe(true)
  })

  it('rejects null and non-object values', () => {
    expect(isValidAccount(null)).toBe(false)
    expect(isValidAccount(undefined)).toBe(false)
    expect(isValidAccount('account')).toBe(false)
  })

  it('rejects an empty account ID', () => {
    expect(isValidAccount({ ...validAccount, id: '  ' })).toBe(false)
  })

  it('rejects an empty account name', () => {
    expect(isValidAccount({ ...validAccount, name: '  ' })).toBe(false)
  })

  it('rejects unsupported account types', () => {
    expect(isValidAccount({ ...validAccount, type: 'credit_card' })).toBe(false)
  })

  it('rejects unsupported currencies', () => {
    expect(isValidAccount({ ...validAccount, currency: 'GBP' })).toBe(false)
  })

  it('rejects negative opening balances', () => {
    expect(isValidAccount({ ...validAccount, openingBalanceMinor: -100 })).toBe(false)
  })

  it('rejects decimal opening balances', () => {
    expect(isValidAccount({ ...validAccount, openingBalanceMinor: 100.5 })).toBe(false)
  })

  it('rejects invalid timestamps', () => {
    expect(isValidAccount({ ...validAccount, createdAt: 'not-a-date' })).toBe(false)
  })

  it('rejects timestamps that are not in canonical UTC format', () => {
    expect(
      isValidAccount({
        ...validAccount,
        createdAt: '2026-11-04T10:00:00Z',
      }),
    ).toBe(false)
  })

  it('accepts an active account with archivedAt set to null', () => {
    expect(isValidAccount(validAccount)).toBe(true)
  })

  it('accepts an archived account with a valid timestamp', () => {
    const archivedAccount = {
      ...validAccount,
      archivedAt: '2026-11-04T12:00:00.000Z',
    }

    expect(isValidAccount(archivedAccount)).toBe(true)
  })

  it('rejects an account with an invalid archivedAt timestamp', () => {
    const invalidAccount = {
      ...validAccount,
      archivedAt: 'not-a-date',
    }

    expect(isValidAccount(invalidAccount)).toBe(false)
  })

  it('rejects an account with an unsupported archivedAt type', () => {
    const invalidAccount = {
      ...validAccount,
      archivedAt: 123,
    }

    expect(isValidAccount(invalidAccount)).toBe(false)
  })
})
