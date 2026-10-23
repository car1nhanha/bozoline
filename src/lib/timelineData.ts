import timelineMeta from '../data/timeline.meta.json'

type EventFile = { events?: unknown[] } | unknown[]

const eventFiles = import.meta.glob<EventFile>('../data/events-*.json', {
  eager: true,
  import: 'default',
})

function readEvents(file: EventFile): unknown[] {
  if (Array.isArray(file)) return file
  return Array.isArray(file.events) ? file.events : []
}

export function loadTimelineInput(): unknown {
  const events = Object.entries(eventFiles)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([, file]) => readEvents(file))

  return { ...timelineMeta, events }
}
