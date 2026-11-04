import { describe, expect, it } from 'vitest'
import { formatMoney } from './money.utils'

describe('formatMoney', () => {
  it('formats USD amounts correctly', () => {
    expect(formatMoney(2550, 'USD')).toBe('$25.50')
  })

  it('formats EUR amounts correctly', () => {
    expect(formatMoney(2550, 'EUR')).toBe('€25.50')
  })

  it('formats whole amounts with two decimal places', () => {
    expect(formatMoney(10000, 'USD')).toBe('$100.00')
  })

  it('formats zero correctly', () => {
    expect(formatMoney(0, 'USD')).toBe('$0.00')
  })

  it('formats amounts smaller than one major currency unit', () => {
    expect(formatMoney(50, 'USD')).toBe('$0.50')
  })
})