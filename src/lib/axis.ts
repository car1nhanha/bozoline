import {
  DAY_MS,
  addUTCDays,
  formatMonth,
  formatShortDate,
  startOfUTCDay,
} from './dates'

export type TickUnit = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'multi-year'

export interface AxisTick {
  time: number
  label: string
  unit: TickUnit
}

export interface YearMarker {
  time: number
  label: string
}

export interface AxisScale {
  unit: TickUnit
  ticks: AxisTick[]
  years: YearMarker[]
}

interface TickStrategy {
  unit: TickUnit
  step: number
  daysPerStep: number
}

const MIN_TICK_SPACING = 108

const SINGLE_UNITS: readonly TickStrategy[] = [
  { unit: 'day', step: 1, daysPerStep: 1 },
  { unit: 'week', step: 1, daysPerStep: 7 },
  { unit: 'month', step: 1, daysPerStep: 30.4375 },
  { unit: 'quarter', step: 1, daysPerStep: 91.3125 },
  { unit: 'year', step: 1, daysPerStep: 365.25 },
]

const MULTI_YEAR_STEPS = [2, 5, 10, 25, 50, 100] as const

export function chooseTickStrategy(pxPerDay: number): TickStrategy {
  for (const strategy of SINGLE_UNITS) {
    if (pxPerDay * strategy.daysPerStep >= MIN_TICK_SPACING) {
      return strategy
    }
  }

  const base = 100
  const fallback =
    MULTI_YEAR_STEPS.find((step) => pxPerDay * 365.25 * step >= MIN_TICK_SPACING) ??
    base * Math.ceil(MIN_TICK_SPACING / (pxPerDay * 365.25 * base))

  return { unit: 'multi-year', step: fallback, daysPerStep: fallback * 365.25 }
}

export function buildAxisScale(
  minTime: number,
  maxTime: number,
  pxPerDay: number,
): AxisScale {
  const safeScale = Math.max(pxPerDay, 0.0001)
  const strategy = chooseTickStrategy(safeScale)
  const ticks: AxisTick[] = []
  let cursor = firstTick(minTime, strategy)
  let guard = 0

  while (cursor <= maxTime && guard < 20_000) {
    ticks.push({
      time: cursor,
      label: tickLabel(cursor, strategy),
      unit: strategy.unit,
    })
    cursor = nextTick(cursor, strategy)
    guard += 1
  }

  return {
    unit: strategy.unit,
    ticks,
    years: buildYearMarkers(minTime, maxTime),
  }
}

function firstTick(minTime: number, strategy: TickStrategy): number {
  switch (strategy.unit) {
    case 'day': {
      const dayStart = startOfUTCDay(minTime)
      return dayStart < minTime ? dayStart + DAY_MS : dayStart
    }
    case 'week': {
      const dayStart = startOfUTCDay(minTime)
      const dayOfWeek = new Date(dayStart).getUTCDay()
      const offset = (8 - dayOfWeek) % 7
      const monday = dayStart + offset * DAY_MS
      return monday < minTime ? monday + 7 * DAY_MS : monday
    }
    case 'month': {
      const date = new Date(minTime)
      const firstOfMonth = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
      return firstOfMonth < minTime
        ? Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
        : firstOfMonth
    }
    case 'quarter': {
      const date = new Date(minTime)
      const quarterMonth = Math.floor(date.getUTCMonth() / 3) * 3
      const firstOfQuarter = Date.UTC(date.getUTCFullYear(), quarterMonth, 1)
      return firstOfQuarter < minTime
        ? Date.UTC(date.getUTCFullYear(), quarterMonth + 3, 1)
        : firstOfQuarter
    }
    case 'year': {
      const date = new Date(minTime)
      const firstOfYear = Date.UTC(date.getUTCFullYear(), 0, 1)
      return firstOfYear < minTime
        ? Date.UTC(date.getUTCFullYear() + 1, 0, 1)
        : firstOfYear
    }
    case 'multi-year': {
      const year = new Date(minTime).getUTCFullYear()
      const firstEligibleYear = Math.ceil(year / strategy.step) * strategy.step
      const firstOfYear = Date.UTC(firstEligibleYear, 0, 1)
      return firstOfYear < minTime
        ? Date.UTC(firstEligibleYear + strategy.step, 0, 1)
        : firstOfYear
    }
  }
}

function nextTick(time: number, strategy: TickStrategy): number {
  switch (strategy.unit) {
    case 'day':
      return addUTCDays(time, 1)
    case 'week':
      return addUTCDays(time, 7)
    case 'month': {
      const date = new Date(time)
      return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
    }
    case 'quarter': {
      const date = new Date(time)
      return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 3, 1)
    }
    case 'year':
      return Date.UTC(new Date(time).getUTCFullYear() + 1, 0, 1)
    case 'multi-year':
      return Date.UTC(
        new Date(time).getUTCFullYear() + strategy.step,
        0,
        1,
      )
  }
}

function tickLabel(time: number, strategy: TickStrategy): string {
  switch (strategy.unit) {
    case 'day':
    case 'week':
      return formatShortDate(time)
    case 'month':
      return formatMonth(time)
    case 'quarter':
      return `T${Math.floor(new Date(time).getUTCMonth() / 3) + 1}`
    case 'year':
    case 'multi-year':
      return String(new Date(time).getUTCFullYear())
  }
}

function buildYearMarkers(minTime: number, maxTime: number): YearMarker[] {
  const firstYear = new Date(minTime).getUTCFullYear()
  const lastYear = new Date(maxTime).getUTCFullYear()
  const markers: YearMarker[] = []

  for (let year = firstYear; year <= lastYear; year += 1) {
    const januaryFirst = Date.UTC(year, 0, 1)
    const time = Math.max(januaryFirst, minTime)
    markers.push({ time, label: String(year) })
  }

  return markers
}
