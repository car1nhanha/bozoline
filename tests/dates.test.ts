import { describe, expect, it } from 'vitest'
import {
  formatFullDate,
  formatRange,
  parseTimelineDate,
  TimelineDateError,
} from '../src/lib/dates'

describe('parseTimelineDate', () => {
  it('parses date-only strings as UTC', () => {
    expect(parseTimelineDate('2024-03-04')).toBe(Date.UTC(2024, 2, 4))
  })

  it('parses ISO timestamps', () => {
    expect(parseTimelineDate('2024-03-04T12:00:00Z')).toBe(
      Date.UTC(2024, 2, 4, 12),
    )
  })

  it('rejects impossible calendar dates', () => {
    expect(() => parseTimelineDate('2024-02-31')).toThrow(TimelineDateError)
    expect(() => parseTimelineDate('yesterday')).toThrow(TimelineDateError)
  })
})

describe('formatting', () => {
  it('formats dates in brazilian portuguese', () => {
    expect(formatFullDate(Date.UTC(2024, 2, 4))).toBe('04/03/2024')
  })

  it('collapses matching years in a range', () => {
    expect(
      formatRange(Date.UTC(2024, 1, 1), Date.UTC(2024, 8, 1)),
    ).toBe('2024')
    expect(
      formatRange(Date.UTC(2022, 10, 1), Date.UTC(2025, 0, 1)),
    ).toBe('2022—2025')
  })
})
