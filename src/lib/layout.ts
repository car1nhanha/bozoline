import type { TimelineEvent, TimelineMarker } from '../types'
import { DAY_MS, parseTimelineDate } from './dates'

export interface TimelineBounds {
  startTime: number
  endTime: number
  spanDays: number
}

export interface EventPlacement {
  event: TimelineEvent
  centerX: number
  visible: boolean
  lane: EventLane
}

export type EventLane = 'above' | 'below'

export interface LayoutOptions {
  startTime: number
  pxPerDay: number
  leftPad: number
  cardWidth: number
  gap: number
}

export function getTimelineBounds(
  events: readonly TimelineEvent[],
  markers: readonly TimelineMarker[] = [],
): TimelineBounds {
  if (events.length === 0 && markers.length === 0) {
    const now = Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    )
    return { startTime: now, endTime: now, spanDays: 1 }
  }

  const times = [
    ...events.map((event) => parseTimelineDate(event.occurredAt)),
    ...markers.map((marker) => parseTimelineDate(marker.date)),
  ]
  const startTime = Math.min(...times)
  const endTime = Math.max(...times)
  const spanDays = Math.max(1, (endTime - startTime) / DAY_MS)

  return { startTime, endTime, spanDays }
}

export function compareEvents(a: TimelineEvent, b: TimelineEvent): number {
  const occurred =
    parseTimelineDate(a.occurredAt) - parseTimelineDate(b.occurredAt)
  if (occurred !== 0) return occurred

  const retrieved =
    parseTimelineDate(a.retrievedAt) - parseTimelineDate(b.retrievedAt)
  if (retrieved !== 0) return retrieved

  return a.id.localeCompare(b.id)
}

export function placeEvents(
  events: readonly TimelineEvent[],
  options: LayoutOptions,
): EventPlacement[] {
  const halfCard = options.cardWidth / 2
  const lastRight: Record<EventLane, number> = {
    above: Number.NEGATIVE_INFINITY,
    below: Number.NEGATIVE_INFINITY,
  }

  return [...events].sort(compareEvents).map((event, index) => {
    const lane: EventLane = index % 2 === 0 ? 'below' : 'above'
    const centerX =
      options.leftPad +
      ((parseTimelineDate(event.occurredAt) - options.startTime) / DAY_MS) *
        options.pxPerDay
    const left = centerX - halfCard
    const right = centerX + halfCard
    const visible = left >= lastRight[lane] + options.gap

    if (visible) {
      lastRight[lane] = right
    }

    return { event, centerX, visible, lane }
  })
}
