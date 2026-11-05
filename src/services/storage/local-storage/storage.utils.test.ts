import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLocalStorage, readStorageItem, writeStorageItem } from './storage.utils'
import { StorageError } from '../storage.types'

describe('getLocalStorage', () => {
  it('returns the browser localStorage object', () => {
    expect(getLocalStorage()).toBe(window.localStorage)
  })

  it('throws STORAGE_UNAVAILABLE when accessing localStorage fails', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('Storage access denied')
    })

    try {
      expect(() => getLocalStorage()).toThrowError(
        expect.objectContaining({
          code: 'STORAGE_UNAVAILABLE',
          originalError: expect.any(Error),
        }),
      )
    } finally {
      vi.restoreAllMocks()
    }
  })
})

describe('readStorageItem', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('returns the stored value when the key exists', () => {
    window.localStorage.setItem('test-key', 'test-value')

    expect(readStorageItem('test-key')).toBe('test-value')
  })

  it('returns null when the key does not exist', () => {
    expect(readStorageItem('missing-key')).toBeNull()
  })

  it('throws STORAGE_READ_FAILED when reading fails', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Read failed')
    })

    try {
      expect(() => readStorageItem('test-key')).toThrowError(
        expect.objectContaining({
          code: 'STORAGE_READ_FAILED',
          originalError: expect.any(Error),
        }),
      )
    } finally {
      vi.restoreAllMocks()
    }
  })

  it('preserves STORAGE_UNAVAILABLE when localStorage is inaccessible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new StorageError('STORAGE_UNAVAILABLE', 'Local storage is unavailable.')
    })

    try {
      expect(() => readStorageItem('test-key')).toThrowError(
        expect.objectContaining({
          code: 'STORAGE_UNAVAILABLE',
        }),
      )
    } finally {
      vi.restoreAllMocks()
    }
  })
})

describe('writeStorageItem', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('stores the value under the specified key', () => {
    writeStorageItem('test-key', 'test-value')

    expect(window.localStorage.getItem('test-key')).toBe('test-value')
  })

  it('throws STORAGE_WRITE_FAILED when writing fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Write failed')
    })

    try {
      expect(() => writeStorageItem('test-key', 'test-value')).toThrowError(
        expect.objectContaining({
          code: 'STORAGE_WRITE_FAILED',
          originalError: expect.any(Error),
        }),
      )
    } finally {
      vi.restoreAllMocks()
    }
  })

  it('preserves STORAGE_UNAVAILABLE when localStorage is inaccessible', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new StorageError('STORAGE_UNAVAILABLE', 'Local storage is unavailable.')
    })

    try {
      expect(() => writeStorageItem('test-key', 'test-value')).toThrowError(
        expect.objectContaining({
          code: 'STORAGE_UNAVAILABLE',
        }),
      )
    } finally {
      vi.restoreAllMocks()
    }
  })
})
