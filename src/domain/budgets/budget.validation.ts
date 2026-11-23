import type { Budget } from './budget.types'
import { isValidPositiveMoneyMinor } from '../money/money.validation'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidYear(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 9999
}

function isValidMonth(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12
}

function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const timestamp = new Date(value)

  return !Number.isNaN(timestamp.getTime()) && timestamp.toISOString() === value
}

export function isValidBudget(value: unknown): value is Budget {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const budget = value as Record<string, unknown>

  return (
    isNonEmptyString(budget.id) &&
    isNonEmptyString(budget.categoryId) &&
    isValidYear(budget.year) &&
    isValidMonth(budget.month) &&
    isValidPositiveMoneyMinor(budget.limitMinor) &&
    isValidIsoTimestamp(budget.createdAt) &&
    isValidIsoTimestamp(budget.updatedAt)
  )
}
