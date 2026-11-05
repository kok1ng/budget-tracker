import type { Account } from './account.types'
import type { Transaction } from '../transactions/transaction.types'

// Account balance
export function calculateAccountBalance(account: Account, transactions: Transaction[]): number {
  let balance = account.openingBalanceMinor

  for (const transaction of transactions) {
    if (transaction.accountId === account.id) {
      if (transaction.type === 'income') {
        balance = updateBalance(balance, transaction.amountMinor)
      }

      if (transaction.type === 'expense' || transaction.type === 'transfer') {
        balance = updateBalance(balance, -transaction.amountMinor)
      }
    }

    if (transaction.type === 'transfer' && transaction.destinationAccountId === account.id) {
      balance = updateBalance(balance, transaction.amountMinor)
    }
  }

  return balance
}

// Total balance across all accounts
export function calculateTotalBalance(accounts: Account[], transactions: Transaction[]): number {
  return accounts.reduce(
    (total, account) => updateBalance(total, calculateAccountBalance(account, transactions)),
    0,
  )
}

function updateBalance(balance: number, change: number): number {
  const result = balance + change

  if (!Number.isSafeInteger(result)) {
    throw new RangeError('Account balance exceeds the safe integer limit')
  }

  return result
}
