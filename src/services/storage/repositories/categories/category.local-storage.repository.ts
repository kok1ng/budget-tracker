import type { Category } from '../../../../domain/categories/category.types'
import { isValidCategory } from '../../../../domain/categories/category.validation'
import { readStorageCollection, writeStorageCollection } from '../../storage-collection.utils'
import type { CategoryRepository } from './category.repository'

const CATEGORIES_STORAGE_KEY = 'budget-tracker:categories'

export class LocalStorageCategoryRepository implements CategoryRepository {
  async getAll(): Promise<Category[]> {
    return readStorageCollection(CATEGORIES_STORAGE_KEY, isValidCategory)
  }

  async getById(id: string): Promise<Category | null> {
    const categories = await this.getAll()

    return categories.find((category) => category.id === id) ?? null
  }

  async save(category: Category): Promise<void> {
    const categories = await this.getAll()
    const existingIndex = categories.findIndex(
      (existingCategory) => existingCategory.id === category.id,
    )

    if (existingIndex === -1) {
      categories.push(category)
    } else {
      categories[existingIndex] = category
    }

    writeStorageCollection(CATEGORIES_STORAGE_KEY, categories, isValidCategory)
  }

  async delete(id: string): Promise<void> {
    const categories = await this.getAll()
    const updatedCategories = categories.filter((category) => category.id !== id)

    writeStorageCollection(CATEGORIES_STORAGE_KEY, updatedCategories, isValidCategory)
  }
}
