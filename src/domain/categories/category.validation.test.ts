import { describe, expect, it } from 'vitest'

import type { Category } from './category.types'
import { isValidCategory } from './category.validation'

const validCategory: Category = {
  id: 'category-1',
  name: 'Food',
  type: 'expense',
  createdAt: '2026-11-18T12:00:00.000Z',
  updatedAt: '2026-11-18T12:00:00.000Z',
}

describe('isValidCategory', () => {
  it('returns true for a valid expense category', () => {
    expect(isValidCategory(validCategory)).toBe(true)
  })

  it('returns true for a valid income category', () => {
    expect(isValidCategory({ ...validCategory, type: 'income' })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isValidCategory(null)).toBe(false)
  })

  it('returns false for a non-object value', () => {
    expect(isValidCategory('category')).toBe(false)
    expect(isValidCategory(123)).toBe(false)
  })

  it('returns false when id is empty', () => {
    expect(isValidCategory({ ...validCategory, id: '' })).toBe(false)
  })

  it('returns false when id contains only whitespace', () => {
    expect(isValidCategory({ ...validCategory, id: '   ' })).toBe(false)
  })

  it('returns false when name is empty', () => {
    expect(isValidCategory({ ...validCategory, name: '' })).toBe(false)
  })

  it('returns false when name contains only whitespace', () => {
    expect(isValidCategory({ ...validCategory, name: '   ' })).toBe(false)
  })

  it('returns false for an unsupported category type', () => {
    expect(isValidCategory({ ...validCategory, type: 'transfer' })).toBe(false)
  })

  it('returns false when createdAt is invalid', () => {
    expect(isValidCategory({ ...validCategory, createdAt: 'invalid-date' })).toBe(false)
  })

  it('returns false when updatedAt is invalid', () => {
    expect(isValidCategory({ ...validCategory, updatedAt: 'invalid-date' })).toBe(false)
  })

  it('returns false when createdAt is not canonical ISO format', () => {
    expect(isValidCategory({ ...validCategory, createdAt: '2026-11-18T12:00:00Z' })).toBe(
      false,
    )
  })

  it('returns false when updatedAt is not canonical ISO format', () => {
    expect(isValidCategory({ ...validCategory, updatedAt: '2026-11-18T12:00:00Z' })).toBe(
      false,
    )
  })
})
