import { StorageError } from './storage.types'
import { CURRENT_STORAGE_SCHEMA_VERSION, type StorageDocument } from './storage-document.types'

export function validateStorageDocument(value: unknown): StorageDocument<unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new StorageError('INVALID_STORAGE_DATA', 'Stored data must be a valid storage document.')
  }

  const document = value as Record<string, unknown>

  if (typeof document.version !== 'number' || !Number.isInteger(document.version)) {
    throw new StorageError(
      'INVALID_STORAGE_DATA',
      'Storage document must contain a valid version number.',
    )
  }

  if (document.version !== CURRENT_STORAGE_SCHEMA_VERSION) {
    throw new StorageError(
      'UNSUPPORTED_SCHEMA_VERSION',
      `Storage schema version ${document.version} is not supported.`,
    )
  }

  if (!Array.isArray(document.data)) {
    throw new StorageError('INVALID_STORAGE_DATA', 'Storage document must contain a data array.')
  }

  return document as unknown as StorageDocument<unknown>
}
