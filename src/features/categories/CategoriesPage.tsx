import { useState } from 'react'

import PageHeader from '../../components/ui/PageHeader'

import type { Category } from '../../domain/categories/category.types'
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../services/categories/category.service.types'

import CategoryForm from './CategoryForm'
import CategorySection from './CategorySection'
import CategoryEditDialog from './CategoryEditDialog'

interface CategoriesPageProps {
  categories: Category[]
  onCreateCategory: (input: CreateCategoryInput) => Promise<Category>
  onUpdateCategory: (id: string, input: UpdateCategoryInput) => Promise<Category>
  onDeleteCategory: (id: string) => Promise<void>
}

function CategoriesPage({
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoriesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Categories"
        description="Organize your income and expenses into categories."
      />

      <CategoryForm onCreateCategory={onCreateCategory} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategorySection
          type="income"
          categories={categories}
          onEditCategory={setSelectedCategory}
          onDeleteCategory={onDeleteCategory}
        />

        <CategorySection
          type="expense"
          categories={categories}
          onEditCategory={setSelectedCategory}
          onDeleteCategory={onDeleteCategory}
        />
      </div>

      {selectedCategory !== null && (
        <CategoryEditDialog
          key={selectedCategory.id}
          category={selectedCategory}
          onUpdateCategory={onUpdateCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  )
}

export default CategoriesPage
