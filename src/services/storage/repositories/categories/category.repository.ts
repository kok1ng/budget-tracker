import type { Category } from '../../../../domain/categories/category.types'

export interface CategoryRepository {
  getAll(): Promise<Category[]>
  getById(id: string): Promise<Category | null>
  save(category: Category): Promise<void>
  delete(id: string): Promise<void>
}
