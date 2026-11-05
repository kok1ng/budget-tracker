import { describe, expect, it } from 'vitest'
import {
  isCurrencyCode,
  isValidNonNegativeMoneyMinor,
  isValidPositiveMoneyMinor,
} from './money.validation'

describe('isValidPositiveMoneyMinor', () => {
  it('accepts positive integers', () => {
    expect(isValidPositiveMoneyMinor(1000)).toBe(true)
    expect(isValidPositiveMoneyMinor(1)).toBe(true)
  })

  it('rejects zero and negative values', () => {
    expect(isValidPositiveMoneyMinor(0)).toBe(false)
    expect(isValidPositiveMoneyMinor(-100)).toBe(false)
  })

  it('rejects decimal values', () => {
    expect(isValidPositiveMoneyMinor(10.5)).toBe(false)
  })

  it('rejects unsafe integers', () => {
    expect(isValidPositiveMoneyMinor(Number.MAX_SAFE_INTEGER + 1)).toBe(false)
  })

  it('rejects non-finite numbers', () => {
    expect(isValidPositiveMoneyMinor(NaN)).toBe(false)
    expect(isValidPositiveMoneyMinor(Infinity)).toBe(false)
  })
})

describe('isValidNonNegativeMoneyMinor', () => {
  it('accepts zero and positive integers', () => {
    expect(isValidNonNegativeMoneyMinor(0)).toBe(true)
    expect(isValidNonNegativeMoneyMinor(1000)).toBe(true)
  })

  it('rejects negative values', () => {
    expect(isValidNonNegativeMoneyMinor(-1)).toBe(false)
  })

  it('rejects decimal values', () => {
    expect(isValidNonNegativeMoneyMinor(10.5)).toBe(false)
  })
})

describe('isCurrencyCode', () => {
  it('accepts supported currencies', () => {
    expect(isCurrencyCode('USD')).toBe(true)
    expect(isCurrencyCode('EUR')).toBe(true)
  })

  it('rejects unsupported currencies', () => {
    expect(isCurrencyCode('GBP')).toBe(false)
    expect(isCurrencyCode('RUB')).toBe(false)
    expect(isCurrencyCode('usd')).toBe(false)
  })
})
