import type { Category } from '../../domain/categories/category.types'
import type { Transaction } from '../../domain/transactions/transaction.types'
import type { Budget } from '../../domain/budgets/budget.types'
import type {
  CreateBudgetInput,
  UpdateBudgetInput,
} from '../../services/budgets/budget.service.types'
import type { CurrencyCode } from '../../domain/money/money.types'

import PageHeader from '../../components/ui/PageHeader'
import BudgetForm from './BudgetForm'
import BudgetList from './BudgetList'

interface BudgetsPageProps {
  budgets: Budget[]
  categories: Category[]
  transactions: Transaction[]
  currency: CurrencyCode | null
  onCreateBudget: (input: CreateBudgetInput) => Promise<Budget>
  onUpdateBudget: (id: string, input: UpdateBudgetInput) => Promise<Budget>
  onDeleteBudget: (id: string) => Promise<void>
}

function BudgetsPage({
  budgets,
  categories,
  transactions,
  currency,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
}: BudgetsPageProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title="Budgets" description="Plan and monitor your spending limits." />

      <BudgetForm
        categories={categories}
        currency={currency}
        budgets={budgets}
        onCreateBudget={onCreateBudget}
      />

      <BudgetList
        budgets={budgets}
        categories={categories}
        transactions={transactions}
        currency={currency}
        onUpdateBudget={onUpdateBudget}
        onDeleteBudget={onDeleteBudget}
      />
    </div>
  )
}

export default BudgetsPage
