import { parseJson, serializeJson } from './json.utils'
import { readStorageItem, writeStorageItem } from './local-storage/storage.utils'
import { CURRENT_STORAGE_SCHEMA_VERSION, type StorageDocument } from './storage-document.types'
import { validateStorageDocument } from './storage-document.utils'
import { StorageError } from './storage.types'

export function readStorageCollection<T>(
  key: string,
  isValidRecord: (value: unknown) => value is T,
): T[] {
  const storedValue = readStorageItem(key)

  if (storedValue === null) {
    return []
  }

  const parsedValue = parseJson(storedValue)
  const document = validateStorageDocument(parsedValue)

  const records: T[] = []

  for (const record of document.data) {
    if (!isValidRecord(record)) {
      throw new StorageError(
        'INVALID_STORAGE_DATA',
        `Stored data contains an invalid record in collection: ${key}.`,
      )
    }

    records.push(record)
  }

  return records
}

export function writeStorageCollection<T>(
  key: string,
  records: T[],
  isValidRecord: (value: unknown) => value is T,
): void {
  for (const record of records) {
    if (!isValidRecord(record)) {
      throw new StorageError(
        'INVALID_STORAGE_DATA',
        `Cannot save invalid record in collection: ${key}.`,
      )
    }
  }

  const document: StorageDocument<T> = {
    version: CURRENT_STORAGE_SCHEMA_VERSION,
    data: records,
  }

  const serializedDocument = serializeJson(document)

  writeStorageItem(key, serializedDocument)
}
