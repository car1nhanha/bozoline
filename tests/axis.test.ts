import { describe, expect, it } from 'vitest'
import {
  buildAxisScale,
  buildMonthBands,
  chooseTickStrategy,
} from '../src/lib/axis'
import { parseTimelineDate } from '../src/lib/dates'

describe('chooseTickStrategy', () => {
  it('uses quarters when zoomed out', () => {
    expect(chooseTickStrategy(1.4).unit).toBe('quarter')
  })

  it('uses months in the middle of the zoom range', () => {
    expect(chooseTickStrategy(4.5).unit).toBe('month')
  })

  it('uses weeks and days when zoomed in', () => {
    expect(chooseTickStrategy(18).unit).toBe('week')
    expect(chooseTickStrategy(130).unit).toBe('day')
  })

  it('falls back to multi-year ticks for extreme zoom-out', () => {
    const strategy = chooseTickStrategy(0.2)
    expect(strategy.unit).toBe('multi-year')
    expect(strategy.step).toBeGreaterThanOrEqual(2)
  })
})

describe('buildAxisScale', () => {
  const min = parseTimelineDate('2023-01-15')
  const max = parseTimelineDate('2024-06-01')

  it('produces ordered monthly ticks inside the range', () => {
    const scale = buildAxisScale(min, max, 4)
    expect(scale.unit).toBe('month')
    expect(scale.ticks.length).toBeGreaterThan(12)
    expect(scale.ticks[0]?.label).toBe('fev.')

    for (let index = 1; index < scale.ticks.length; index += 1) {
      const previous = scale.ticks[index - 1]
      const current = scale.ticks[index]
      expect(previous && current ? current.time > previous.time : false).toBe(true)
    }
  })

  it('builds year markers clamped to the timeline start', () => {
    const scale = buildAxisScale(min, max, 1.4)
    expect(scale.years).toEqual([
      { time: min, label: '2023' },
      { time: parseTimelineDate('2024-01-01'), label: '2024' },
    ])
  })
})

describe('buildMonthBands', () => {
  it('covers the range with contiguous month bands', () => {
    const bands = buildMonthBands(
      parseTimelineDate('2023-01-15'),
      parseTimelineDate('2023-03-10'),
    )

    expect(bands).toEqual([
      {
        startTime: parseTimelineDate('2023-01-15'),
        endTime: parseTimelineDate('2023-02-01'),
        index: 2023 * 12,
      },
      {
        startTime: parseTimelineDate('2023-02-01'),
        endTime: parseTimelineDate('2023-03-01'),
        index: 2023 * 12 + 1,
      },
      {
        startTime: parseTimelineDate('2023-03-01'),
        endTime: parseTimelineDate('2023-03-10'),
        index: 2023 * 12 + 2,
      },
    ])
  })

  it('returns no bands for an empty range', () => {
    const time = parseTimelineDate('2023-01-15')
    expect(buildMonthBands(time, time)).toEqual([])
  })
})
