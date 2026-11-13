export type AccountOperationErrorCode =
  | 'ACCOUNT_NOT_FOUND'
  | 'INVALID_ACCOUNT'
  | 'ACCOUNT_HAS_TRANSACTIONS'
  | 'OPENING_BALANCE_IMMUTABLE'
  | 'ACCOUNT_BALANCE_NOT_ZERO'
  | 'ACCOUNT_ALREADY_ARCHIVED'
  | 'ACCOUNT_NOT_ARCHIVED'
  | 'CURRENCY_MISMATCH'

export class AccountOperationError extends Error {
  public readonly code: AccountOperationErrorCode

  constructor(code: AccountOperationErrorCode, message: string) {
    super(message)
    this.name = 'AccountOperationError'
    this.code = code
  }
}
