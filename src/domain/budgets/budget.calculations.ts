import type { Budget } from './budget.types'
import type { MoneyMinor } from '../money/money.types'
import type { Transaction } from '../transactions/transaction.types'

export interface BudgetProgress {
  spentMinor: MoneyMinor
  remainingMinor: MoneyMinor
  usagePercentage: number
  isOverspent: boolean
}

function addSafeIntegers(total: number, amount: number): number {
  const result = total + amount

  if (!Number.isSafeInteger(result)) {
    throw new RangeError('Budget spending exceeds the safe integer limit')
  }

  return result
}

export function calculateBudgetSpent(budget: Budget, transactions: Transaction[]): MoneyMinor {
  const budgetMonth = `${budget.year}-${String(budget.month).padStart(2, '0')}`

  return transactions
    .filter(
      (transaction) =>
        transaction.type === 'expense' &&
        transaction.categoryId === budget.categoryId &&
        transaction.date.startsWith(`${budgetMonth}-`),
    )
    .reduce((total, transaction) => addSafeIntegers(total, transaction.amountMinor), 0)
}

export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
): BudgetProgress {
  const spentMinor = calculateBudgetSpent(budget, transactions)
  const remainingMinor = budget.limitMinor - spentMinor

  if (!Number.isSafeInteger(remainingMinor)) {
    throw new RangeError('Budget remaining amount exceeds the safe integer limit')
  }

  return {
    spentMinor,
    remainingMinor,
    usagePercentage: Number(((spentMinor / budget.limitMinor) * 100).toFixed(2)),
    isOverspent: spentMinor > budget.limitMinor,
  }
}
