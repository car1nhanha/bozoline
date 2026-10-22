import type { TimelineEvent } from '../types'

export interface TimelineFilter {
  entityIds: readonly string[]
  topicIds: readonly string[]
}

export function filterEvents(
  events: readonly TimelineEvent[],
  filter: TimelineFilter,
): TimelineEvent[] {
  const entityIds = new Set(filter.entityIds)
  const topicIds = new Set(filter.topicIds)

  if (entityIds.size === 0 && topicIds.size === 0) {
    return [...events]
  }

  return events.filter((event) => {
    const entityMatch =
      entityIds.size === 0 || event.entityIds.some((id) => entityIds.has(id))
    const topicMatch =
      topicIds.size === 0 || event.topicIds.some((id) => topicIds.has(id))

    return entityMatch && topicMatch
  })
}
