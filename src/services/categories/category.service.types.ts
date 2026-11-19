import type { CategoryType } from '../../domain/categories/category.types'

export interface CreateCategoryInput {
  name: string
  type: CategoryType
}

export interface UpdateCategoryInput {
  name: string
  type: CategoryType
}

export interface CategoryServiceOptions {
  generateId: () => string
  getCurrentTimestamp: () => string
}
