import { describe, expect, it } from 'vitest'
import timelineJson from '../src/data/timeline.json'
import { parseTimelineData, TimelineDataError } from '../src/lib/validation'

describe('parseTimelineData', () => {
  it('accepts the bundled timeline', () => {
    const data = parseTimelineData(timelineJson)
    expect(data.events.length).toBeGreaterThan(0)
    expect(data.entities.length).toBeGreaterThan(0)
    expect(data.topics.length).toBeGreaterThan(0)
    expect(data.entities.some((entity) => entity.kind === 'person')).toBe(true)
    expect(data.topics.some((topic) => topic.id === 'twitter')).toBe(true)
  })

  it('rejects invalid entity kinds', () => {
    const invalid = {
      entities: [{ id: 'entity', name: 'Entidade', kind: 'alien' }],
      topics: [],
      events: [],
    }

    expect(() => parseTimelineData(invalid)).toThrow(/kind/)
  })

  it('parses markers with a title and date', () => {
    const data = parseTimelineData({
      entities: [],
      topics: [],
      markers: [
        {
          id: 'marker',
          title: 'Eleição presidencial',
          date: '2018-10-28',
        },
      ],
      events: [],
    })

    expect(data.markers).toEqual([
      {
        id: 'marker',
        title: 'Eleição presidencial',
        date: '2018-10-28',
      },
    ])
  })

  it('rejects markers with invalid dates', () => {
    const invalid = {
      entities: [],
      topics: [],
      markers: [{ id: 'marker', title: 'Marco', date: 'not-a-date' }],
      events: [],
    }

    expect(() => parseTimelineData(invalid)).toThrow(/not-a-date/)
  })

  it('rejects a retrieval date before the event date', () => {
    const invalid = {
      entities: [],
      topics: [],
      events: [
        {
          id: 'event',
          title: 'Event',
          occurredAt: '2024-02-01',
          retrievedAt: '2024-01-01',
          topicIds: [],
          entityIds: [],
        },
      ],
    }

    expect(() => parseTimelineData(invalid)).toThrow(TimelineDataError)
    expect(() => parseTimelineData(invalid)).toThrow(/retrievedAt/)
  })

  it('rejects unknown references', () => {
    const invalid = {
      entities: [],
      topics: [],
      events: [
        {
          id: 'event',
          title: 'Event',
          occurredAt: '2024-01-01',
          retrievedAt: '2024-01-02',
          topicIds: ['missing-topic'],
          entityIds: [],
        },
      ],
    }

    expect(() => parseTimelineData(invalid)).toThrow(/Tema desconhecido/)
  })

  it('rejects duplicate ids', () => {
    const invalid = {
      entities: [
        { id: 'same', name: 'First' },
        { id: 'same', name: 'Second' },
      ],
      topics: [],
      events: [],
    }

    expect(() => parseTimelineData(invalid)).toThrow(/ID duplicado/)
  })

  it('rejects non-http links', () => {
    const invalid = {
      entities: [],
      topics: [],
      events: [
        {
          id: 'event',
          title: 'Event',
          occurredAt: '2024-01-01',
          retrievedAt: '2024-01-02',
          link: 'javascript:alert(1)',
          topicIds: [],
          entityIds: [],
        },
      ],
    }

    expect(() => parseTimelineData(invalid)).toThrow(/http/)
  })
})
