import type { Transaction, TransactionType } from './transaction.types'

import { isCurrencyCode, isValidPositiveMoneyMinor } from '../money/money.validation'

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense', 'transfer']

function isTransactionType(value: unknown): value is TransactionType {
  return TRANSACTION_TYPES.includes(value as TransactionType)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

//Date validation
function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

//ISO timestamp validation
function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const date = new Date(value)

  return !Number.isNaN(date.getTime()) && date.toISOString() === value
}

export function isValidTransaction(value: unknown): value is Transaction {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const transaction = value as Record<string, unknown>

  const hasValidDestination =
    transaction.type === 'transfer'
      ? isNonEmptyString(transaction.destinationAccountId) &&
        transaction.destinationAccountId !== transaction.accountId
      : transaction.destinationAccountId === null

  return (
    isNonEmptyString(transaction.id) &&
    isTransactionType(transaction.type) &&
    isValidPositiveMoneyMinor(transaction.amountMinor) &&
    isCurrencyCode(transaction.currency) &&
    isNonEmptyString(transaction.description) &&
    (transaction.categoryId === null || isNonEmptyString(transaction.categoryId)) &&
    isNonEmptyString(transaction.accountId) &&
    hasValidDestination &&
    isValidDate(transaction.date) &&
    isValidIsoTimestamp(transaction.createdAt) &&
    isValidIsoTimestamp(transaction.updatedAt)
  )
}
