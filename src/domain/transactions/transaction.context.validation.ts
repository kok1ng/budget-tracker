import type { Account } from '../accounts/account.types'
import type { Transaction } from './transaction.types'

export function isTransactionContextValid(
  transaction: Transaction,
  accounts: Account[],
  categoryIds: string[],
): boolean {
  const sourceAccount = accounts.find(
    (account) => account.id === transaction.accountId,
  )

  if (!sourceAccount) {
    return false
  }

  if (sourceAccount.archivedAt !== null) {
  return false
}

  if (sourceAccount.currency !== transaction.currency) {
    return false
  }

  if (
    transaction.categoryId !== null &&
    !categoryIds.includes(transaction.categoryId)
  ) {
    return false
  }

  if (transaction.type === 'transfer') {
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