import { describe, expect, it } from 'vitest'
import { isValidBudget } from './budget.validation'
import type { Budget } from './budget.types'

const validBudget: Budget = {
  id: 'budget-1',
  categoryId: 'category-1',
  year: 2026,
  month: 11,
  limitMinor: 50000,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
}

describe('isValidBudget', () => {
  it('accepts a valid budget', () => {
    expect(isValidBudget(validBudget)).toBe(true)
  })

  it('accepts the minimum valid year and month', () => {
    expect(isValidBudget({ ...validBudget, year: 1, month: 1 })).toBe(true)
  })

  it('accepts the maximum valid year and month', () => {
    expect(isValidBudget({ ...validBudget, year: 9999, month: 12 })).toBe(true)
  })

  it('rejects null and non-object values', () => {
    expect(isValidBudget(null)).toBe(false)
    expect(isValidBudget(undefined)).toBe(false)
    expect(isValidBudget('budget')).toBe(false)
    expect(isValidBudget(123)).toBe(false)
  })

  it('rejects empty IDs', () => {
    expect(isValidBudget({ ...validBudget, id: '' })).toBe(false)
    expect(isValidBudget({ ...validBudget, categoryId: ' ' })).toBe(false)
  })

  it('rejects invalid years', () => {
    expect(isValidBudget({ ...validBudget, year: 0 })).toBe(false)
    expect(isValidBudget({ ...validBudget, year: 10000 })).toBe(false)
    expect(isValidBudget({ ...validBudget, year: 2026.5 })).toBe(false)
  })

  it('rejects invalid months', () => {
    expect(isValidBudget({ ...validBudget, month: 0 })).toBe(false)
    expect(isValidBudget({ ...validBudget, month: 13 })).toBe(false)
    expect(isValidBudget({ ...validBudget, month: 1.5 })).toBe(false)
  })

  it('rejects invalid budget limits', () => {
    expect(isValidBudget({ ...validBudget, limitMinor: 0 })).toBe(false)
    expect(isValidBudget({ ...validBudget, limitMinor: -100 })).toBe(false)
    expect(isValidBudget({ ...validBudget, limitMinor: 100.5 })).toBe(false)
    expect(isValidBudget({ ...validBudget, limitMinor: Number.MAX_SAFE_INTEGER + 1 })).toBe(false)
  })

  it('rejects invalid timestamps', () => {
    expect(isValidBudget({ ...validBudget, createdAt: 'invalid-date' })).toBe(false)
    expect(isValidBudget({ ...validBudget, updatedAt: '2026-02-30T10:00:00.000Z' })).toBe(false)
  })

  it('rejects non-canonical ISO timestamps', () => {
    expect(isValidBudget({ ...validBudget, createdAt: '2026-11-01T10:00:00Z' })).toBe(false)
  })
})
