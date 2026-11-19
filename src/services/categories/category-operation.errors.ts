export type CategoryOperationErrorCode =
  | 'CATEGORY_NOT_FOUND'
  | 'INVALID_CATEGORY'
  | 'CATEGORY_NAME_ALREADY_EXISTS'
  | 'CATEGORY_HAS_TRANSACTIONS'
  | 'CATEGORY_TYPE_IN_USE'

export class CategoryOperationError extends Error {
  public readonly code: CategoryOperationErrorCode

  constructor(code: CategoryOperationErrorCode, message: string) {
    super(message)
    this.name = 'CategoryOperationError'
    this.code = code
  }
}
