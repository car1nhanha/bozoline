import type {
  Entity,
  LinkPreview,
  TimelineData,
  TimelineEvent,
  TimelineMarker,
  Topic,
} from '../types'
import { parseTimelineDate } from './dates'

export class TimelineDataError extends Error {
  readonly path: string

  constructor(message: string, path: string) {
    super(`${message} (at ${path})`)
    this.name = 'TimelineDataError'
    this.path = path
  }
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TimelineDataError('Esperado um objeto', path)
  }
  return value as Record<string, unknown>
}

function readArray(
  record: Record<string, unknown>,
  key: string,
  path: string,
): unknown[] {
  const value = record[key]
  if (!Array.isArray(value)) {
    throw new TimelineDataError(`Esperado que "${key}" seja um array`, path)
  }
  return value
}

function readRequiredString(
  record: Record<string, unknown>,
  key: string,
  path: string,
): string {
  const value = record[key]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TimelineDataError(`Esperado que "${key}" seja um texto não vazio`, path)
  }
  return value
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
  path: string,
): string | undefined {
  const value = record[key]
  if (value === undefined) return undefined
  if (typeof value !== 'string') {
    throw new TimelineDataError(`Esperado que "${key}" seja um texto`, path)
  }
  return value
}

function readStringArray(
  record: Record<string, unknown>,
  key: string,
  path: string,
): string[] {
  const value = record[key]
  if (!Array.isArray(value)) {
    throw new TimelineDataError(`Esperado que "${key}" seja um array`, path)
  }

  return value.map((entry, index) => {
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      throw new TimelineDataError(
        `Esperado que "${key}[${index}]" seja um texto não vazio`,
        path,
      )
    }
    return entry
  })
}

function ensureUniqueIds(
  entries: readonly { id: string }[],
  collection: string,
): void {
  const seen = new Set<string>()

  for (const [index, entry] of entries.entries()) {
    if (seen.has(entry.id)) {
      throw new TimelineDataError(
        `ID duplicado "${entry.id}"`,
        `${collection}[${index}].id`,
      )
    }
    seen.add(entry.id)
  }
}

function parseMarker(value: unknown, path: string): TimelineMarker {
  const record = asRecord(value, path)
  const marker: TimelineMarker = {
    id: readRequiredString(record, 'id', path),
    title: readRequiredString(record, 'title', path),
    date: readRequiredString(record, 'date', path),
  }

  parseTimelineDate(marker.date)
  return marker
}

function parseEntity(value: unknown, path: string): Entity {
  const record = asRecord(value, path)
  return {
    id: readRequiredString(record, 'id', path),
    name: readRequiredString(record, 'name', path),
  }
}

function parseTopic(value: unknown, path: string): Topic {
  const record = asRecord(value, path)
  return {
    id: readRequiredString(record, 'id', path),
    name: readRequiredString(record, 'name', path),
  }
}

function parsePreview(value: unknown, path: string): LinkPreview {
  const record = asRecord(value, path)
  const preview: LinkPreview = {}

  const title = readOptionalString(record, 'title', path)
  const description = readOptionalString(record, 'description', path)
  const image = readOptionalString(record, 'image', path)
  const site = readOptionalString(record, 'site', path)

  if (title !== undefined) preview.title = title
  if (description !== undefined) preview.description = description
  if (image !== undefined) preview.image = image
  if (site !== undefined) preview.site = site

  return preview
}

function assertHttpUrl(value: string, path: string): void {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    throw new TimelineDataError('Esperado uma URL absoluta válida', path)
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TimelineDataError('Esperado uma URL http(s)', path)
  }
}

function parseEvent(
  value: unknown,
  path: string,
  topicIds: ReadonlySet<string>,
  entityIds: ReadonlySet<string>,
): TimelineEvent {
  const record = asRecord(value, path)
  const event: TimelineEvent = {
    id: readRequiredString(record, 'id', path),
    title: readRequiredString(record, 'title', path),
    occurredAt: readRequiredString(record, 'occurredAt', path),
    retrievedAt: readRequiredString(record, 'retrievedAt', path),
    topicIds: readStringArray(record, 'topicIds', path),
    entityIds: readStringArray(record, 'entityIds', path),
  }

  const description = readOptionalString(record, 'description', path)
  const coverImage = readOptionalString(record, 'coverImage', path)
  const link = readOptionalString(record, 'link', path)
  const previewValue = record.preview

  if (description !== undefined) event.description = description
  if (coverImage !== undefined) event.coverImage = coverImage
  if (link !== undefined) {
    assertHttpUrl(link, `${path}.link`)
    event.link = link
  }
  if (previewValue !== undefined) {
    event.preview = parsePreview(previewValue, `${path}.preview`)
  }

  const occurredTime = parseTimelineDate(event.occurredAt)
  const retrievedTime = parseTimelineDate(event.retrievedAt)

  if (retrievedTime < occurredTime) {
    throw new TimelineDataError(
      '"retrievedAt" deve ser igual ou posterior a "occurredAt"',
      path,
    )
  }

  for (const topicId of event.topicIds) {
    if (!topicIds.has(topicId)) {
      throw new TimelineDataError(`Tema desconhecido "${topicId}"`, `${path}.topicIds`)
    }
  }

  for (const entityId of event.entityIds) {
    if (!entityIds.has(entityId)) {
      throw new TimelineDataError(
        `Envolvido desconhecido "${entityId}"`,
        `${path}.entityIds`,
      )
    }
  }

  return event
}

export function parseTimelineData(input: unknown): TimelineData {
  const root = asRecord(input, 'timeline')
  const entities = readArray(root, 'entities', 'timeline').map((entry, index) =>
    parseEntity(entry, `entities[${index}]`),
  )
  const topics = readArray(root, 'topics', 'timeline').map((entry, index) =>
    parseTopic(entry, `topics[${index}]`),
  )

  const markers = root.markers === undefined
    ? []
    : readArray(root, 'markers', 'timeline').map((entry, index) =>
        parseMarker(entry, `markers[${index}]`),
      )

  ensureUniqueIds(entities, 'entities')
  ensureUniqueIds(topics, 'topics')
  ensureUniqueIds(markers, 'markers')

  const topicIds = new Set(topics.map((topic) => topic.id))
  const entityIds = new Set(entities.map((entity) => entity.id))
  const events = readArray(root, 'events', 'timeline').map((entry, index) =>
    parseEvent(entry, `events[${index}]`, topicIds, entityIds),
  )

  ensureUniqueIds(events, 'events')

  return { entities, topics, markers, events }
}
