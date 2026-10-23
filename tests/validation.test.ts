import { describe, expect, it } from 'vitest'
import { loadTimelineInput } from '../src/lib/timelineData'
import { parseTimelineData, TimelineDataError } from '../src/lib/validation'

describe('parseTimelineData', () => {
  it('accepts the bundled timeline', () => {
    const data = parseTimelineData(loadTimelineInput())
    expect(data.events.length).toBeGreaterThan(0)
    expect(data.entities.length).toBeGreaterThan(0)
    expect(data.topics.length).toBeGreaterThan(0)
    expect(data.entities.some((entity) => entity.kind === 'person')).toBe(true)
    expect(data.topics.some((topic) => topic.id === 'twitter')).toBe(true)
  })


  it('accepts events with content only in the preview', () => {
    const data = parseTimelineData({
      entities: [],
      topics: [],
      events: [
        {
          id: 'event',
          occurredAt: '2024-01-01',
          retrievedAt: '2024-01-02',
          link: 'https://example.com/materia',
          preview: {
            title: 'Título da matéria',
            description: 'Descrição da matéria',
            image: 'https://example.com/capa.jpg',
            site: 'Exemplo',
          },
          topicIds: [],
          entityIds: [],
        },
      ],
    })

    expect(data.events[0]?.title).toBeUndefined()
    expect(data.events[0]?.preview?.title).toBe('Título da matéria')
  })

  it('accepts empty optional content fields', () => {
    const data = parseTimelineData({
      entities: [],
      topics: [],
      events: [
        {
          id: 'event',
          title: '',
          description: '',
          coverImage: '',
          occurredAt: '2024-01-01',
          retrievedAt: '2024-01-02',
          topicIds: [],
          entityIds: [],
        },
      ],
    })

    expect(data.events[0]?.title).toBeUndefined()
    expect(data.events[0]?.description).toBeUndefined()
    expect(data.events[0]?.coverImage).toBeUndefined()
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
