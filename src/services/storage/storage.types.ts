export type StorageErrorCode =
  | 'STORAGE_UNAVAILABLE'
  | 'STORAGE_READ_FAILED'
  | 'STORAGE_WRITE_FAILED'
  | 'INVALID_JSON'
  | 'INVALID_STORAGE_DATA'
  | 'UNSUPPORTED_SCHEMA_VERSION'

export class StorageError extends Error {
  public readonly code: StorageErrorCode
  public readonly originalError?: unknown

  constructor(code: StorageErrorCode, message: string, originalError?: unknown) {
    super(message)

    this.name = 'StorageError'
    this.code = code
    this.originalError = originalError
  }
}
