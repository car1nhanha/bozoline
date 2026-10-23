import { describe, expect, it } from 'vitest'
import {
  eventDescription,
  eventImage,
  eventImageAlt,
  eventTitle,
} from '../src/lib/eventContent'
import type { TimelineEvent } from '../src/types'

function makeEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: 'event',
    occurredAt: '2024-01-01',
    retrievedAt: '2024-01-02',
    topicIds: [],
    entityIds: [],
    ...overrides,
  }
}

describe('event content', () => {
  it('prefers preview content', () => {
    const event = makeEvent({
      title: 'Título antigo',
      description: 'Descrição antiga',
      coverImage: 'https://example.com/antiga.jpg',
      preview: {
        title: 'Título da prévia',
        description: 'Descrição da prévia',
        image: 'https://example.com/previa.jpg',
        site: 'Exemplo',
      },
    })

    expect(eventTitle(event)).toBe('Título da prévia')
    expect(eventDescription(event)).toBe('Descrição da prévia')
    expect(eventImage(event)).toBe('https://example.com/previa.jpg')
    expect(eventImageAlt(event)).toBe('Título da prévia')
  })

  it('falls back to optional event fields', () => {
    const event = makeEvent({
      title: 'Título antigo',
      description: 'Descrição antiga',
      coverImage: 'https://example.com/antiga.jpg',
    })

    expect(eventTitle(event)).toBe('Título antigo')
    expect(eventDescription(event)).toBe('Descrição antiga')
    expect(eventImage(event)).toBe('https://example.com/antiga.jpg')
    expect(eventImageAlt(event)).toBe('Título antigo')
  })

  it('degrades gracefully without title, description or image', () => {
    const event = makeEvent({ link: 'https://example.com/materia' })

    expect(eventTitle(event)).toBe('example.com')
    expect(eventDescription(event)).toBe('')
    expect(eventImage(event)).toBe('')
    expect(eventImageAlt(event)).toBe('Imagem do evento')
  })
})
