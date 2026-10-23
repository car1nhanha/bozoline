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
  event('jair-redes', ['jair'], ['redes_sociais_e_desinformacao']),
  event('jair-economia', ['jair'], ['economia']),
  event('flavio-redes', ['flavio'], ['redes_sociais_e_desinformacao']),
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
        topicIds: ['redes_sociais_e_desinformacao'],
      }).map((entry) => entry.id),
    ).toEqual(['jair-redes', 'flavio-redes'])

    expect(
      filterEvents(events, {
        entityIds: ['jair'],
        topicIds: ['redes_sociais_e_desinformacao', 'economia'],
      }).map((entry) => entry.id),
    ).toEqual(['jair-redes', 'jair-economia'])
  })

  it('requires entity and topic filters to match together', () => {
    expect(
      filterEvents(events, {
        entityIds: ['flavio'],
        topicIds: ['redes_sociais_e_desinformacao'],
      }).map((entry) => entry.id),
    ).toEqual(['flavio-redes'])

    expect(
      filterEvents(events, {
        entityIds: ['jair'],
        topicIds: ['justica'],
      }),
    ).toEqual([])
  })
})
