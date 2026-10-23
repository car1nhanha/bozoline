import type { TimelineEvent } from '../types'
import { displaySource } from './links'

export function eventTitle(event: TimelineEvent): string {
  const title = event.preview?.title?.trim() || event.title?.trim()
  if (title) return title

  const source = event.link ? displaySource(event.link, event.preview?.site) : ''
  return source || 'Evento sem título'
}

export function eventDescription(event: TimelineEvent): string {
  return event.preview?.description?.trim() || event.description?.trim() || ''
}

export function eventImage(event: TimelineEvent): string {
  return event.preview?.image?.trim() || event.coverImage?.trim() || ''
}

export function eventImageAlt(event: TimelineEvent): string {
  return (
    event.preview?.title?.trim() ||
    event.title?.trim() ||
    'Imagem do evento'
  )
}
