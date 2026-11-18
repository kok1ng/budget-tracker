import type { Category, CategoryType } from './category.types'

const CATEGORY_TYPES: CategoryType[] = ['income', 'expense']

function isCategoryType(value: unknown): value is CategoryType {
  return CATEGORY_TYPES.includes(value as CategoryType)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false

  const date = new Date(value)

  return !Number.isNaN(date.getTime()) && date.toISOString() === value
}

export function isValidCategory(value: unknown): value is Category {
  if (typeof value !== 'object' || value === null) return false

  const category = value as Record<string, unknown>

  return (
    isNonEmptyString(category.id) &&
    isNonEmptyString(category.name) &&
    isCategoryType(category.type) &&
    isValidIsoTimestamp(category.createdAt) &&
    isValidIsoTimestamp(category.updatedAt)
  )
}
