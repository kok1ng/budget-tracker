import { useState } from 'react'

import type { Category, CategoryType } from '../../domain/categories/category.types'

interface CategorySectionProps {
  type: CategoryType
  categories: Category[]
  onEditCategory: (category: Category) => void
  onDeleteCategory: (id: string) => Promise<void>
}

function CategorySection({
  type,
  categories,
  onEditCategory,
  onDeleteCategory,
}: CategorySectionProps) {
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sectionCategories = categories.filter((category) => category.type === type)

  const title = type === 'income' ? 'Income categories' : 'Expense categories'

  async function handleDeleteCategory() {
    if (categoryToDelete === null) {
      return
    }

    setErrorMessage(null)
    setIsDeleting(true)

    try {
      await onDeleteCategory(categoryToDelete.id)
      setCategoryToDelete(null)
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while deleting the category.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

      {sectionCategories.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No {type} categories yet.</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100">
          {sectionCategories.map((category) => (
            <li
              key={category.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="font-medium text-slate-900">{category.name}</p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onEditCategory(category)}
                  disabled={isDeleting}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null)
                    setCategoryToDelete(category)
                  }}
                  disabled={isDeleting}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {categoryToDelete !== null && (
        <section
          aria-labelledby="delete-category-heading"
          className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-5"
        >
          <h3 id="delete-category-heading" className="text-lg font-semibold text-slate-900">
            Delete {categoryToDelete.name}?
          </h3>

          <p className="mt-2 text-sm text-slate-600">
            This action cannot be undone. Categories used by transactions cannot be deleted.
          </p>

          {errorMessage !== null && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null)
                setCategoryToDelete(null)
              }}
              disabled={isDeleting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void handleDeleteCategory()}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Confirm delete'}
            </button>
          </div>
        </section>
      )}
    </section>
  )
}

export default CategorySection
