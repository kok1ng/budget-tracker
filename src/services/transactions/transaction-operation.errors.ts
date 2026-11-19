export type TransactionOperationErrorCode =
  | 'INVALID_TRANSACTION'
  | 'TRANSACTION_NOT_FOUND'
  | 'ACCOUNT_NOT_FOUND'
  | 'ACCOUNT_ARCHIVED'
  | 'INSUFFICIENT_BALANCE'
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_TYPE_MISMATCH'

export class TransactionOperationError extends Error {
  public readonly code: TransactionOperationErrorCode

  constructor(code: TransactionOperationErrorCode, message: string) {
    super(message)
    this.name = 'TransactionOperationError'
    this.code = code
  }
}
