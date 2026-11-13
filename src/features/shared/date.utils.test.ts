import { afterEach, describe, expect, it, vi } from 'vitest'
import { getLocalDateString } from './date.utils'

describe('getLocalDateString', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the current local date in YYYY-MM-DD format', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 10, 13, 12, 0, 0))

    expect(getLocalDateString()).toBe('2026-11-13')
  })

  it('pads single-digit months and days with zeros', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5, 12, 0, 0))

    expect(getLocalDateString()).toBe('2026-01-05')
  })
})
