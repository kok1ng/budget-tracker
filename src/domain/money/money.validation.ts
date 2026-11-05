import type { CurrencyCode, MoneyMinor } from './money.types'

export function isValidPositiveMoneyMinor(value: unknown): value is MoneyMinor {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

export function isValidNonNegativeMoneyMinor(value: unknown): value is MoneyMinor {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === 'USD' || value === 'EUR'
}
