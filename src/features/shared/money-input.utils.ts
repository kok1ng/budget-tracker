import type { MoneyMinor } from '../../domain/money/money.types'

export function parseAmountToMinorUnits(value: string): MoneyMinor | null {
  const normalizedValue = value.trim()

  const match = /^(\d+)(?:\.(\d+))?$/.exec(normalizedValue)

  if (!match) {
    return null
  }

  const integerPart = Number(match[1])

  if (!Number.isSafeInteger(integerPart)) {
    return null
  }

  const decimalPart = match[2] ?? ''

  // Take the first two decimal digits and pad missing digits with zeros.
  const firstTwoDecimalDigits = Number((decimalPart + '00').slice(0, 2))

  let amountMinor = integerPart * 100 + firstTwoDecimalDigits

  // Round half up based on the third decimal digit.
  const thirdDecimalDigit = Number(decimalPart[2] ?? '0')

  if (thirdDecimalDigit >= 5) {
    amountMinor += 1
  }

  if (!Number.isSafeInteger(amountMinor)) {
    return null
  }

  return amountMinor
}
