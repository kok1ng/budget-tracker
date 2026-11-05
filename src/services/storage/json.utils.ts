import { StorageError } from './storage.types'

export function parseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch (error) {
    throw new StorageError('INVALID_JSON', 'Failed to parse stored JSON data.', error)
  }
}

export function serializeJson(value: unknown): string {
  try {
    const result = JSON.stringify(value)

    if (result === undefined) {
      throw new StorageError('INVALID_STORAGE_DATA', 'Failed to serialize data into JSON.')
    }

    return result
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }

    throw new StorageError('INVALID_STORAGE_DATA', 'Failed to serialize data into JSON.', error)
  }
}
