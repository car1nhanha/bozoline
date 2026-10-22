import { describe, expect, it } from 'vitest'
import { filterEvents } from '../src/lib/filters'
import type { TimelineEvent } from '../src/types'

function event(
  id: string,
  entityIds: string[],
  topicIds: string[],
): TimelineEvent {
  return {
    id,
    title: id,
    occurredAt: '2020-01-01',
    retrievedAt: '2020-01-02',
    entityIds,
    topicIds,
  }
}

const events = [
  event('jair-twitter', ['jair'], ['twitter']),
  event('jair-economia', ['jair'], ['economia']),
  event('flavio-twitter', ['flavio'], ['twitter']),
  event('flavio-justica', ['flavio'], ['justica']),
]

describe('filterEvents', () => {
  it('returns all events when no filters are active', () => {
    expect(filterEvents(events, { entityIds: [], topicIds: [] })).toEqual(events)
  })

  it('matches any selected entity and any selected topic', () => {
    expect(
      filterEvents(events, {
        entityIds: ['jair', 'flavio'],
        topicIds: ['twitter'],
      }).map((entry) => entry.id),
    ).toEqual(['jair-twitter', 'flavio-twitter'])

    expect(
      filterEvents(events, {
        entityIds: ['jair'],
        topicIds: ['twitter', 'economia'],
      }).map((entry) => entry.id),
    ).toEqual(['jair-twitter', 'jair-economia'])
  })

  it('requires entity and topic filters to match together', () => {
    expect(
      filterEvents(events, {
        entityIds: ['flavio'],
        topicIds: ['twitter'],
      }).map((entry) => entry.id),
    ).toEqual(['flavio-twitter'])

    expect(
      filterEvents(events, {
        entityIds: ['jair'],
        topicIds: ['justica'],
      }),
    ).toEqual([])
  })
})
