import type { Account, AccountType } from './account.types'
import {
  isCurrencyCode,
  isValidNonNegativeMoneyMinor,
} from '../money/money.validation'

const ACCOUNT_TYPES: AccountType[] = [
  'cash',
  'debit_card',
  'bank_account',
  'savings',
]

function isAccountType(value: unknown): value is AccountType {
  return ACCOUNT_TYPES.includes(value as AccountType)
}

function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const date = new Date(value)

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString() === value
  )
}

export function isValidAccount(value: unknown): value is Account {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const account = value as Record<string, unknown>

  return (
    typeof account.id === 'string' &&
    account.id.trim().length > 0 &&
    typeof account.name === 'string' &&
    account.name.trim().length > 0 &&
    isAccountType(account.type) &&
    isCurrencyCode(account.currency) &&
    isValidNonNegativeMoneyMinor(account.openingBalanceMinor) &&
    isValidIsoTimestamp(account.createdAt) &&
    isValidIsoTimestamp(account.updatedAt)
  )
}