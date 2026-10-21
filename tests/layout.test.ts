import { describe, expect, it } from 'vitest'
import { getTimelineBounds, placeEvents } from '../src/lib/layout'
import { parseTimelineDate } from '../src/lib/dates'
import type { TimelineEvent } from '../src/types'

function makeEvent(
  id: string,
  occurredAt: string,
  retrievedAt = occurredAt,
): TimelineEvent {
  return {
    id,
    title: id,
    occurredAt,
    retrievedAt,
    topicIds: [],
    entityIds: [],
  }
}

const events = [
  makeEvent('a', '2023-01-01'),
  makeEvent('b', '2023-01-10'),
  makeEvent('c', '2023-01-20'),
  makeEvent('d', '2024-01-01'),
]

const options = {
  startTime: parseTimelineDate('2023-01-01'),
  cardWidth: 300,
  gap: 24,
  leftPad: 200,
}

describe('placeEvents', () => {
  it('hides colliding cards on the same lane when zoomed out', () => {
    const placements = placeEvents(events, { ...options, pxPerDay: 0.2 })
    const visible = placements
      .filter((placement) => placement.visible)
      .map((placement) => placement.event.id)

    expect(visible).toEqual(['a', 'b'])
    expect(placements.find((placement) => placement.event.id === 'c')?.visible).toBe(false)
  })

  it('alternates events above and below the line', () => {
    const placements = placeEvents(events, { ...options, pxPerDay: 2 })
    expect(placements.map((placement) => placement.lane)).toEqual([
      'below',
      'above',
      'below',
      'above',
    ])
  })

  it('reveals more cards as the scale increases', () => {
    const medium = placeEvents(events, { ...options, pxPerDay: 2 })
    const close = placeEvents(events, { ...options, pxPerDay: 40 })

    const mediumVisible = medium.filter((placement) => placement.visible).length
    const closeVisible = close.filter((placement) => placement.visible).length

    expect(mediumVisible).toBeGreaterThan(1)
    expect(closeVisible).toBeGreaterThan(mediumVisible)
    expect(close.every((placement) => placement.visible)).toBe(true)
  })

  it('lays events out in chronological order', () => {
    const placements = placeEvents(events, { ...options, pxPerDay: 1 })
    expect(placements.map((placement) => placement.event.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ])
  })
})

describe('getTimelineBounds', () => {
  it('uses occurredAt dates for the timeline range', () => {
    const bounds = getTimelineBounds(events)
    expect(bounds.startTime).toBe(parseTimelineDate('2023-01-01'))
    expect(bounds.endTime).toBe(parseTimelineDate('2024-01-01'))
    expect(bounds.spanDays).toBe(365)
  })

  it('handles an empty timeline', () => {
    const bounds = getTimelineBounds([])
    expect(bounds.spanDays).toBe(1)
  })

  it('includes markers in the timeline range', () => {
    const bounds = getTimelineBounds(events, [
      { id: 'marker', title: 'Marco', date: '2022-06-01' },
    ])
    expect(bounds.startTime).toBe(parseTimelineDate('2022-06-01'))
    expect(bounds.endTime).toBe(parseTimelineDate('2024-01-01'))
  })
})
