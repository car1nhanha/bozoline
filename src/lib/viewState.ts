export interface TimelineViewState {
  pxPerDay: number
  offset: number
}

interface ViewStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const STORAGE_KEY = 'bolsoline:timeline-view:v1'

function defaultStorage(): ViewStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function loadTimelineView(
  storage: ViewStorage | null = defaultStorage(),
): TimelineViewState | null {
  if (!storage) return null

  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null

    const { pxPerDay, offset } = parsed
    if (
      typeof pxPerDay !== 'number' ||
      !Number.isFinite(pxPerDay) ||
      pxPerDay <= 0 ||
      typeof offset !== 'number' ||
      !Number.isFinite(offset)
    ) {
      return null
    }

    return { pxPerDay, offset }
  } catch {
    return null
  }
}

export function saveTimelineView(
  view: TimelineViewState,
  storage: ViewStorage | null = defaultStorage(),
): boolean {
  if (!storage) return false

  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ pxPerDay: view.pxPerDay, offset: view.offset }),
    )
    return true
  } catch {
    return false
  }
}
