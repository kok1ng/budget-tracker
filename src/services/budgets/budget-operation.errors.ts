export type BudgetOperationErrorCode =
  | 'BUDGET_NOT_FOUND'
  | 'INVALID_BUDGET'
  | 'BUDGET_ALREADY_EXISTS'
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_TYPE_MISMATCH'

export class BudgetOperationError extends Error {
  public readonly code: BudgetOperationErrorCode

  constructor(code: BudgetOperationErrorCode, message: string) {
    super(message)

    this.name = 'BudgetOperationError'
    this.code = code
  }
}
