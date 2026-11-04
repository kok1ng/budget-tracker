
import type { Account } from './account.types'
import { isValidAccount } from './account.validation'
import type { Transaction } from '../transactions/transaction.types'


//Create a new account and add it to the accounts array. If the account is invalid, throw an error. If an account with the same ID already exists, throw an error. Return a new array with the added account.
export function createAccount(
  accounts: Account[],
  newAccount: Account,
): Account[] {
  if (!isValidAccount(newAccount)) {
    throw new Error('Invalid account')
  }

  const accountExists = accounts.some(
    (account) => account.id === newAccount.id,
  )

  if (accountExists) {
    throw new Error('Account with this ID already exists')
  }

  return [...accounts, newAccount]
}


//Update an existing account in the accounts array. If the account does not exist, throw an error. If the updated account is invalid, throw an error. If the updated account's creation date is different from the existing account's creation date, throw an error. Return a new array with the updated account.
export function updateAccount(
  accounts: Account[],
  updatedAccount: Account,
): Account[] {
  const existingAccount = accounts.find(
    (account) => account.id === updatedAccount.id,
  )

  if (!existingAccount) {
    throw new Error('Account not found')
  }

  if (updatedAccount.createdAt !== existingAccount.createdAt) {
    throw new Error('Account creation date cannot be changed')
  }

  if (updatedAccount.archivedAt !== existingAccount.archivedAt) {
  throw new Error('Account archive status cannot be changed directly')
}

  if (!isValidAccount(updatedAccount)) {
    throw new Error('Invalid account')
  }

  return accounts.map((account) =>
    account.id === updatedAccount.id ? updatedAccount : account,
  )
}


//Delete an existing account from the accounts array. If the account does not exist, throw an error. If there are any transactions associated with the account, throw an error. Return a new array without the deleted account.
export function deleteAccount(
  accounts: Account[],
  accountId: string,
  transactions: Transaction[],
): Account[] {
  const accountExists = accounts.some(
    (account) => account.id === accountId,
  )

  if (!accountExists) {
    throw new Error('Account not found')
  }

  const hasTransactions = transactions.some(
    (transaction) =>
      transaction.accountId === accountId ||
      transaction.destinationAccountId === accountId,
  )

  if (hasTransactions) {
    throw new Error('Cannot delete an account with transactions')
  }

  return accounts.filter((account) => account.id !== accountId)
}


// Archive an existing account. Reject missing or already archived accounts.
export function archiveAccount(
  accounts: Account[],
  accountId: string,
  archivedAt: string,
): Account[] {
  const existingAccount = accounts.find(
    (account) => account.id === accountId,
  )

  if (!existingAccount) {
    throw new Error('Account not found')
  }

  if (existingAccount.archivedAt !== null) {
    throw new Error('Account is already archived')
  }

  const updatedAccount: Account = {
    ...existingAccount,
    archivedAt,
    updatedAt: archivedAt,
  }

  if (!isValidAccount(updatedAccount)) {
    throw new Error('Invalid archive timestamp')
  }

  return accounts.map((account) =>
    account.id === accountId ? updatedAccount : account,
  )
}


//restore an existing archived account in the accounts array. If the account does not exist, throw an error. If the account is not archived, throw an error. Return a new array with the restored account.

export function restoreAccount(
  accounts: Account[],
  accountId: string,
  updatedAt: string,
): Account[] {
  const existingAccount = accounts.find(
    (account) => account.id === accountId,
  )

  if (!existingAccount) {
    throw new Error('Account not found')
  }

  if (existingAccount.archivedAt === null) {
    throw new Error('Account is not archived')
  }

  const updatedAccount: Account = {
    ...existingAccount,
    archivedAt: null,
    updatedAt,
  }

  if (!isValidAccount(updatedAccount)) {
    throw new Error('Invalid update timestamp')
  }

  return accounts.map((account) =>
    account.id === accountId ? updatedAccount : account,
  )
}

// Find an account by ID. Return undefined if the account does not exist.
export function getAccountById(
  accounts: Account[],
  accountId: string,
): Account | undefined {
  return accounts.find((account) => account.id === accountId)
}


// Return a new array containing all accounts, including archived accounts.
export function getAllAccounts(
  accounts: Account[],
): Account[] {
  return [...accounts]
}
