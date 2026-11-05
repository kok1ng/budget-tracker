import { describe, expect, it } from 'vitest'
import { parseJson, serializeJson } from './json.utils'
import { StorageError } from './storage.types'

describe('parseJson', () => {
  it('should parse a valid JSON object', () => {
    const result = parseJson('{"name":"Main account","balance":150000}')

    expect(result).toEqual({
      name: 'Main account',
      balance: 150000,
    })
  })

  it('should parse a valid JSON array', () => {
    const result = parseJson('[1, 2, 3]')

    expect(result).toEqual([1, 2, 3])
  })

  it('should parse a valid JSON primitive', () => {
    expect(parseJson('"hello"')).toBe('hello')
    expect(parseJson('123')).toBe(123)
    expect(parseJson('true')).toBe(true)
  })

  it('should parse JSON null', () => {
    expect(parseJson('null')).toBeNull()
  })

  it('should throw StorageError when JSON is invalid', () => {
    expect(() => parseJson('{"name":')).toThrow(StorageError)

    try {
      parseJson('{"name":')
    } catch (error) {
      expect(error).toBeInstanceOf(StorageError)

      if (error instanceof StorageError) {
        expect(error.code).toBe('INVALID_JSON')
        expect(error.originalError).toBeInstanceOf(SyntaxError)
      }
    }
  })
})

describe('serializeJson', () => {
  it('should serialize a valid object', () => {
    const value = {
      name: 'Main account',
      balance: 150000,
    }

    expect(serializeJson(value)).toBe('{"name":"Main account","balance":150000}')
  })

  it('should serialize a valid array', () => {
    expect(serializeJson([1, 2, 3])).toBe('[1,2,3]')
  })

  it('should serialize a primitive value', () => {
    expect(serializeJson('hello')).toBe('"hello"')
    expect(serializeJson(123)).toBe('123')
    expect(serializeJson(true)).toBe('true')
  })

  it('should throw StorageError when value cannot be serialized', () => {
    expect(() => serializeJson(undefined)).toThrow(StorageError)

    try {
      serializeJson(undefined)
    } catch (error) {
      expect(error).toBeInstanceOf(StorageError)

      if (error instanceof StorageError) {
        expect(error.code).toBe('INVALID_STORAGE_DATA')
      }
    }
  })

  it('should throw StorageError when value contains circular references', () => {
    const circularObject: { self?: unknown } = {}
    circularObject.self = circularObject

    try {
      serializeJson(circularObject)
    } catch (error) {
      expect(error).toBeInstanceOf(StorageError)

      if (error instanceof StorageError) {
        expect(error.code).toBe('INVALID_STORAGE_DATA')
        expect(error.originalError).toBeInstanceOf(TypeError)
      }
    }
  })
})
