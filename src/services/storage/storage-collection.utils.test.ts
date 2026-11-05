import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readStorageItem, writeStorageItem } from './local-storage/storage.utils'
import { readStorageCollection, writeStorageCollection } from './storage-collection.utils'
import { CURRENT_STORAGE_SCHEMA_VERSION } from './storage-document.types'

vi.mock('./local-storage/storage.utils', () => ({
  readStorageItem: vi.fn(),
  writeStorageItem: vi.fn(),
}))

interface TestRecord {
  id: string
}

function isValidTestRecord(value: unknown): value is TestRecord {
  return (
    typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string'
  )
}

describe('readStorageCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty array when the storage key does not exist', () => {
    vi.mocked(readStorageItem).mockReturnValue(null)

    expect(readStorageCollection('test-key', isValidTestRecord)).toEqual([])
  })

  it('returns validated records from a storage document', () => {
    const records = [{ id: '1' }, { id: '2' }]

    vi.mocked(readStorageItem).mockReturnValue(
      JSON.stringify({
        version: CURRENT_STORAGE_SCHEMA_VERSION,
        data: records,
      }),
    )

    expect(readStorageCollection('test-key', isValidTestRecord)).toEqual(records)
  })

  it('throws when a stored record is invalid', () => {
    vi.mocked(readStorageItem).mockReturnValue(
      JSON.stringify({
        version: CURRENT_STORAGE_SCHEMA_VERSION,
        data: [{ id: '1' }, { id: 2 }],
      }),
    )

    expect(() => readStorageCollection('test-key', isValidTestRecord)).toThrow(
      expect.objectContaining({
        code: 'INVALID_STORAGE_DATA',
      }),
    )
  })

  it('throws when the stored JSON is invalid', () => {
    vi.mocked(readStorageItem).mockReturnValue('{ invalid json')

    expect(() => readStorageCollection('test-key', isValidTestRecord)).toThrow(
      expect.objectContaining({
        code: 'INVALID_JSON',
      }),
    )
  })

  it('throws when the storage document has an unsupported version', () => {
    vi.mocked(readStorageItem).mockReturnValue(
      JSON.stringify({
        version: 999,
        data: [],
      }),
    )

    expect(() => readStorageCollection('test-key', isValidTestRecord)).toThrow(
      expect.objectContaining({
        code: 'UNSUPPORTED_SCHEMA_VERSION',
      }),
    )
  })

  it('throws when the storage document structure is invalid', () => {
    vi.mocked(readStorageItem).mockReturnValue(
      JSON.stringify({
        version: CURRENT_STORAGE_SCHEMA_VERSION,
        data: 'not-an-array',
      }),
    )

    expect(() => readStorageCollection('test-key', isValidTestRecord)).toThrow(
      expect.objectContaining({
        code: 'INVALID_STORAGE_DATA',
      }),
    )
  })
})

describe('writeStorageCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('writes a versioned storage document', () => {
    const records = [{ id: '1' }, { id: '2' }]

    writeStorageCollection('test-key', records, isValidTestRecord)

    expect(writeStorageItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify({
        version: CURRENT_STORAGE_SCHEMA_VERSION,
        data: records,
      }),
    )
  })

  it('does not write when a record is invalid', () => {
    const records = [{ id: '1' }, { id: 2 }]

    expect(() =>
      writeStorageCollection('test-key', records as TestRecord[], isValidTestRecord),
    ).toThrow(
      expect.objectContaining({
        code: 'INVALID_STORAGE_DATA',
      }),
    )

    expect(writeStorageItem).not.toHaveBeenCalled()
  })

  it('writes an empty collection', () => {
    writeStorageCollection('test-key', [], isValidTestRecord)

    expect(writeStorageItem).toHaveBeenCalledWith(
      'test-key',
      JSON.stringify({
        version: CURRENT_STORAGE_SCHEMA_VERSION,
        data: [],
      }),
    )
  })

  it('does not write when serialization fails', () => {
    const record: TestRecord & { self?: unknown } = { id: '1' }

    record.self = record

    expect(() => writeStorageCollection('test-key', [record], isValidTestRecord)).toThrow(
      expect.objectContaining({
        code: 'INVALID_STORAGE_DATA',
      }),
    )

    expect(writeStorageItem).not.toHaveBeenCalled()
  })
})
