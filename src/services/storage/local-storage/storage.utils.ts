import { StorageError } from '../storage.types'

export function getLocalStorage(): Storage {
  try {
    return window.localStorage
  } catch (error) {
    throw new StorageError('STORAGE_UNAVAILABLE', 'Local storage is unavailable.', error)
  }
}

export function readStorageItem(key: string): string | null {
  try {
    return getLocalStorage().getItem(key)
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }

    throw new StorageError('STORAGE_READ_FAILED', `Failed to read storage item: ${key}.`, error)
  }
}

export function writeStorageItem(key: string, value: string): void {
  try {
    getLocalStorage().setItem(key, value)
  } catch (error) {
    if (error instanceof StorageError) {
      throw error
    }

    throw new StorageError('STORAGE_WRITE_FAILED', `Failed to write storage item: ${key}.`, error)
  }
}
