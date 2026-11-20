import { useState, type FormEvent } from 'react'

import type { Category, CategoryType } from '../../domain/categories/category.types'
import type { CreateCategoryInput } from '../../services/categories/category.service.types'

interface CategoryFormProps {
  onCreateCategory: (input: CreateCategoryInput) => Promise<Category>
}

function CategoryForm({ onCreateCategory }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>('expense')

  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage(null)
    setSuccessMessage(null)

    const trimmedName = name.trim()

    if (trimmedName.length === 0) {
      setErrorMessage('Enter a category name.')
      return
    }

    setIsSaving(true)

    try {
      await onCreateCategory({
        name: trimmedName,
        type,
      })

      setName('')
      setType('expense')
      setSuccessMessage('Category created successfully.')
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while creating the category.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const inputClassName =
    'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Add category</h2>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="category-name" className="block text-sm font-medium text-slate-700">
            Category name
          </label>
          <input
            id="category-name"
            type="text"
            className={inputClassName}
            placeholder="e.g. Groceries"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="category-type" className="block text-sm font-medium text-slate-700">
            Category type
          </label>
          <select
            id="category-type"
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

        {successMessage !== null && (
          <p role="status" className="text-sm text-green-700">
            {successMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Add category'}
        </button>
      </form>
    </section>
  )
}

export default CategoryForm
