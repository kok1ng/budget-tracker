export const CURRENT_STORAGE_SCHEMA_VERSION = 1

export interface StorageDocument<T> {
  version: number
  data: T[]
}
