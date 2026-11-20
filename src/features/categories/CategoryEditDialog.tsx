import { useState, type FormEvent } from 'react'

import type { Category, CategoryType } from '../../domain/categories/category.types'
import type { UpdateCategoryInput } from '../../services/categories/category.service.types'

interface CategoryEditDialogProps {
  category: Category
  onUpdateCategory: (id: string, input: UpdateCategoryInput) => Promise<Category>
  onClose: () => void
}

function CategoryEditDialog({ category, onUpdateCategory, onClose }: CategoryEditDialogProps) {
  const [name, setName] = useState(category.name)
  const [type, setType] = useState<CategoryType>(category.type)

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)

    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
      setErrorMessage('Category name is required.')
      return
    }

    const input: UpdateCategoryInput = {
      name: trimmedName,
      type,
    }

    setIsSaving(true)

    try {
      await onUpdateCategory(category.id, input)
      onClose()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while updating the category.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const inputClassName =
    'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-category-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="edit-category-title" className="text-lg font-semibold text-slate-900">
          Edit category
        </h2>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="edit-category-name"
              className="block text-sm font-medium text-slate-700"
            >
              Category name
            </label>
            <input
              id="edit-category-name"
              type="text"
              className={inputClassName}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              disabled={isSaving}
            />
          </div>

          <div>
            <label
              htmlFor="edit-category-type"
              className="block text-sm font-medium text-slate-700"
            >
              Category type
            </label>
            <select
              id="edit-category-type"
              className={inputClassName}
              value={type}
              onChange={(event) => setType(event.target.value as CategoryType)}
              disabled={isSaving}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {errorMessage !== null && (
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default CategoryEditDialog
