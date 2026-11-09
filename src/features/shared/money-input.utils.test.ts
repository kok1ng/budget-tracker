import { describe, expect, it } from 'vitest'
import { parseAmountToMinorUnits } from './money-input.utils'

describe('parseAmountToMinorUnits', () => {
  it('converts whole numbers into minor units', () => {
    expect(parseAmountToMinorUnits('125')).toBe(12500)
  })

  it('converts decimal numbers into minor units', () => {
    expect(parseAmountToMinorUnits('125.50')).toBe(12550)
    expect(parseAmountToMinorUnits('0.99')).toBe(99)
  })

  it('returns zero for zero amounts', () => {
    expect(parseAmountToMinorUnits('0')).toBe(0)
    expect(parseAmountToMinorUnits('0.00')).toBe(0)
  })

  it('rounds amounts with more than two decimal places', () => {
    expect(parseAmountToMinorUnits('123.154')).toBe(12315)
    expect(parseAmountToMinorUnits('123.155')).toBe(12316)
    expect(parseAmountToMinorUnits('123.999')).toBe(12400)
  })

  it('handles rounding across a whole-number boundary', () => {
    expect(parseAmountToMinorUnits('9.999')).toBe(1000)
  })

  it('accepts surrounding whitespace', () => {
    expect(parseAmountToMinorUnits('  125.50  ')).toBe(12550)
  })

  it('rejects negative amounts', () => {
    expect(parseAmountToMinorUnits('-10.00')).toBeNull()
  })

  it('rejects comma decimal separators', () => {
    expect(parseAmountToMinorUnits('124,50')).toBeNull()
  })

  it('rejects invalid formats', () => {
    expect(parseAmountToMinorUnits('')).toBeNull()
    expect(parseAmountToMinorUnits('abc')).toBeNull()
    expect(parseAmountToMinorUnits('.50')).toBeNull()
    expect(parseAmountToMinorUnits('12.')).toBeNull()
  })

  it('rejects values exceeding the safe integer limit', () => {
    expect(parseAmountToMinorUnits('90071992547410')).toBeNull()
  })
})
