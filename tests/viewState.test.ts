import { describe, expect, it } from 'vitest'
import { loadTimelineView, saveTimelineView } from '../src/lib/viewState'

function memoryStorage() {
  let value: string | null = null

  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next
    },
  }
}

describe('timeline view storage', () => {
  it('round-trips the zoom and position', () => {
    const storage = memoryStorage()

    expect(saveTimelineView({ pxPerDay: 12.5, offset: -840 }, storage)).toBe(true)
    expect(loadTimelineView(storage)).toEqual({ pxPerDay: 12.5, offset: -840 })
  })

  it('rejects an empty or malformed value', () => {
    const storage = memoryStorage()

    expect(loadTimelineView(storage)).toBeNull()
    storage.setItem('key', '{not json')
    expect(loadTimelineView(storage)).toBeNull()
  })

  it('rejects invalid scales', () => {
    const storage = memoryStorage()

    storage.setItem('key', JSON.stringify({ pxPerDay: 0, offset: 0 }))
    expect(loadTimelineView(storage)).toBeNull()

    storage.setItem('key', JSON.stringify({ pxPerDay: 2, offset: '0' }))
    expect(loadTimelineView(storage)).toBeNull()
  })
})
