import { describe, expect, it } from 'vitest'
import { CURRENT_STORAGE_SCHEMA_VERSION } from './storage-document.types'
import { validateStorageDocument } from './storage-document.utils'

describe('validateStorageDocument', () => {
  describe('valid documents', () => {
    it('accepts an empty storage document', () => {
      const document = {
        version: CURRENT_STORAGE_SCHEMA_VERSION,
        data: [],
      }

      expect(validateStorageDocument(document)).toEqual(document)
    })

    it('accepts a storage document containing records', () => {
      const document = {
        version: CURRENT_STORAGE_SCHEMA_VERSION,
        data: [{ id: '1' }, { id: '2' }],
      }

      expect(validateStorageDocument(document)).toEqual(document)
    })

    it('returns records with unknown types', () => {
      const document = {
        version: CURRENT_STORAGE_SCHEMA_VERSION,
        data: [{ id: '1' }],
      }

      const result = validateStorageDocument(document)

      expect(result.data).toEqual([{ id: '1' }])
    })

    it('accepts additional document properties', () => {
      const document = {
        version: CURRENT_STORAGE_SCHEMA_VERSION,
        data: [],
        metadata: 'additional information',
      }

      expect(validateStorageDocument(document)).toEqual(document)
    })

    it('does not validate individual records', () => {
      const document = {
        version: CURRENT_STORAGE_SCHEMA_VERSION,
        data: [null, 'invalid', 123],
      }

      expect(validateStorageDocument(document)).toEqual(document)
    })
  })

  describe('invalid document structures', () => {
    it.each([null, [], 'text', 123, true])('rejects non-object values: %s', (value) => {
      expect(() => validateStorageDocument(value)).toThrow(
        expect.objectContaining({
          code: 'INVALID_STORAGE_DATA',
        }),
      )
    })

    it('rejects a document without a version', () => {
      expect(() => validateStorageDocument({ data: [] })).toThrow(
        expect.objectContaining({
          code: 'INVALID_STORAGE_DATA',
        }),
      )
    })

    it.each([null, {}, 'text', 123])('rejects a non-array data property: %s', (data) => {
      expect(() => validateStorageDocument({ version: 1, data })).toThrow(
        expect.objectContaining({
          code: 'INVALID_STORAGE_DATA',
        }),
      )
    })
  })

  describe('invalid version values', () => {
    it.each(['1', null, undefined, 1.5, NaN, Infinity, -Infinity])(
      'rejects an invalid version: %s',
      (version) => {
        expect(() => validateStorageDocument({ version, data: [] })).toThrow(
          expect.objectContaining({
            code: 'INVALID_STORAGE_DATA',
          }),
        )
      },
    )
  })

  describe('unsupported schema versions', () => {
    it.each([0, 2, 999])('rejects unsupported version: %s', (version) => {
      expect(() => validateStorageDocument({ version, data: [] })).toThrow(
        expect.objectContaining({
          code: 'UNSUPPORTED_SCHEMA_VERSION',
        }),
      )
    })
  })
})
