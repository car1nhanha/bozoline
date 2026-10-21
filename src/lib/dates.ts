export const DAY_MS = 86_400_000

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

const fullDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: 'UTC',
})

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  timeZone: 'UTC',
})

export class TimelineDateError extends Error {
  constructor(value: string) {
    super(`Data inválida na linha do tempo: "${value}"`)
    this.name = 'TimelineDateError'
  }
}

export function parseTimelineDate(value: string): number {
  const match = DATE_ONLY.exec(value.trim())

  if (match) {
    const [, yearText, monthText, dayText] = match
    if (!yearText || !monthText || !dayText) {
      throw new TimelineDateError(value)
    }

    const year = Number(yearText)
    const month = Number(monthText)
    const day = Number(dayText)
    const time = Date.UTC(year, month - 1, day)
    const date = new Date(time)

    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      throw new TimelineDateError(value)
    }

    return time
  }

  const time = Date.parse(value)
  if (Number.isNaN(time)) {
    throw new TimelineDateError(value)
  }

  return time
}

export function startOfUTCDay(time: number): number {
  const date = new Date(time)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

export function daysBetween(start: number, end: number): number {
  return (startOfUTCDay(end) - startOfUTCDay(start)) / DAY_MS
}

export function addUTCDays(time: number, days: number): number {
  return time + days * DAY_MS
}

export function addUTCMonths(time: number, months: number): number {
  const date = new Date(time)
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1)
}

export function formatFullDate(time: number): string {
  return fullDateFormatter.format(time)
}

export function formatShortDate(time: number): string {
  return shortDateFormatter.format(time)
}

export function formatMonth(time: number): string {
  return monthFormatter.format(time)
}

export function formatYear(time: number): string {
  return String(new Date(time).getUTCFullYear())
}

export function formatRange(start: number, end: number): string {
  const startYear = formatYear(start)
  const endYear = formatYear(end)
  return startYear === endYear ? startYear : `${startYear}—${endYear}`
}
