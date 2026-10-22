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
  row: number
}

export type EventLane = 'above' | 'below'

export interface LayoutOptions {
  startTime: number
  pxPerDay: number
  leftPad: number
  cardWidth: number
  gap: number
  rows?: number
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
  const rows = Math.max(1, Math.floor(options.rows ?? 1))
  const lastRight: Record<EventLane, number[]> = {
    above: Array.from({ length: rows }, () => Number.NEGATIVE_INFINITY),
    below: Array.from({ length: rows }, () => Number.NEGATIVE_INFINITY),
  }

  return [...events].sort(compareEvents).map((event, index) => {
    const preferred: EventLane = index % 2 === 0 ? 'below' : 'above'
    const fallback: EventLane = preferred === 'below' ? 'above' : 'below'
    const centerX =
      options.leftPad +
      ((parseTimelineDate(event.occurredAt) - options.startTime) / DAY_MS) *
        options.pxPerDay
    const left = centerX - halfCard
    const right = centerX + halfCard

    let lane = preferred
    let row = 0
    let visible = false

    for (let candidateRow = 0; candidateRow < rows && !visible; candidateRow += 1) {
      for (const candidateLane of [preferred, fallback]) {
        const last = lastRight[candidateLane][candidateRow]
        if (last === undefined || left < last + options.gap) continue

        lane = candidateLane
        row = candidateRow
        visible = true
        lastRight[candidateLane][candidateRow] = right
        break
      }
    }

    return { event, centerX, visible, lane, row }
  })
}
