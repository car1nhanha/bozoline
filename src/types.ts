export type EntityKind = 'person' | 'organization' | 'country' | 'group'

export interface Entity {
  id: string
  name: string
  kind?: EntityKind
}

export interface Topic {
  id: string
  name: string
}

export interface LinkPreview {
  title?: string
  description?: string
  image?: string
  site?: string
}

export interface TimelineMarker {
  id: string
  title: string
  date: string
}

export interface TimelineEvent {
  id: string
  title?: string
  description?: string
  occurredAt: string
  retrievedAt: string
  coverImage?: string
  link?: string
  preview?: LinkPreview
  topicIds: string[]
  entityIds: string[]
}

export interface TimelineData {
  entities: Entity[]
  topics: Topic[]
  markers: TimelineMarker[]
  events: TimelineEvent[]
}
