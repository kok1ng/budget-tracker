import type { Account } from '../accounts/account.types'
import type { Category } from '../categories/category.types'
import type { Transaction } from './transaction.types'

export function isTransactionContextValid(
  transaction: Transaction,
  accounts: Account[],
  categories: Category[],
): boolean {
  const sourceAccount = accounts.find((account) => account.id === transaction.accountId)

  if (!sourceAccount) {
    return false
  }

  if (sourceAccount.archivedAt !== null) {
    return false
  }

  if (sourceAccount.currency !== transaction.currency) {
    return false
  }

  if (transaction.categoryId !== null) {
    const category = categories.find((item) => item.id === transaction.categoryId)

    if (!category) {
      return false
    }

    if (transaction.type !== category.type) {
      return false
    }
  }

  if (transaction.type === 'transfer') {
    if (transaction.categoryId !== null) {
      return false
    }

    const destinationAccount = accounts.find(
      (account) => account.id === transaction.destinationAccountId,
    )

    if (!destinationAccount) {
      return false
    }

    if (destinationAccount.archivedAt !== null) {
      return false
    }

    if (destinationAccount.id === sourceAccount.id) {
      return false
    }

    if (destinationAccount.currency !== transaction.currency) {
      return false
    }
  }

  return true
}
