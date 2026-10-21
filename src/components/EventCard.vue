<script setup lang="ts">
import { computed } from 'vue'
import MediaCard from './MediaCard.vue'
import type { Entity, TimelineEvent, Topic } from '../types'
import { hashHue } from '../lib/color'
import { formatFullDate, parseTimelineDate } from '../lib/dates'
import { displaySource } from '../lib/links'

const props = defineProps<{
  event: TimelineEvent
  entities: readonly Entity[]
  topics: readonly Topic[]
}>()

const occurredLabel = computed(() =>
  formatFullDate(parseTimelineDate(props.event.occurredAt)),
)
const retrievedLabel = computed(() =>
  formatFullDate(parseTimelineDate(props.event.retrievedAt)),
)

const involved = computed(() =>
  props.event.entityIds
    .map((id) => props.entities.find((entity) => entity.id === id))
    .filter((entity): entity is Entity => entity !== undefined),
)
const eventTopics = computed(() =>
  props.event.topicIds
    .map((id) => props.topics.find((topic) => topic.id === id))
    .filter((topic): topic is Topic => topic !== undefined),
)

const description = computed(
  () => props.event.description ?? props.event.preview?.description ?? '',
)
const source = computed(() =>
  displaySource(props.event.link, props.event.preview?.site),
)
const involvedNames = computed(() =>
  involved.value.map((entity) => entity.name).join(' · '),
)
const visibleEntities = computed(() => involved.value.slice(0, 3))

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function avatarStyle(entity: Entity): Record<string, string> {
  const hue = hashHue(entity.id)
  return {
    background: `hsl(${hue} 46% 24%)`,
    color: `hsl(${hue} 92% 84%)`,
    borderColor: `hsl(${hue} 60% 48% / 45%)`,
  }
}
</script>

<template>
  <article class="event-card">
    <MediaCard :event="event" />

    <div class="info-card">
      <div class="event-meta">
        <span class="meta-item">
          <span class="meta-label">Ocorrido</span>
          <time :datetime="event.occurredAt">{{ occurredLabel }}</time>
        </span>
        <span class="meta-separator" aria-hidden="true" />
        <span
          class="meta-item"
          title="Data do registro mais antigo encontrado para este evento"
        >
          <span class="meta-label">Obtido</span>
          <time :datetime="event.retrievedAt">{{ retrievedLabel }}</time>
        </span>
      </div>

      <h2 class="event-title">{{ event.title }}</h2>

      <p v-if="description" class="event-description">{{ description }}</p>

      <div v-if="eventTopics.length > 0" class="topic-row">
        <span
          v-for="topic in eventTopics"
          :key="topic.id"
          class="topic-chip"
        >
          {{ topic.name }}
        </span>
      </div>

      <div class="event-footer">
        <div v-if="involved.length > 0" class="involved">
          <span class="avatar-stack" :title="involvedNames">
            <span
              v-for="entity in visibleEntities"
              :key="entity.id"
              class="avatar"
              :style="avatarStyle(entity)"
            >
              {{ initials(entity.name) }}
            </span>
            <span
              v-if="involved.length > visibleEntities.length"
              class="avatar avatar-more"
            >
              +{{ involved.length - visibleEntities.length }}
            </span>
          </span>
          <span class="involved-names">{{ involvedNames }}</span>
        </div>

        <a
          v-if="event.link"
          class="source-link"
          :href="event.link"
          target="_blank"
          rel="noopener noreferrer"
          :title="`Abrir fonte em ${source}`"
        >
          {{ source }}
          <span class="source-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.event-card:hover {
  transform: translateY(-4px);
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 13px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: rgba(15, 17, 25, 0.94);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(12px);
  transition:
    border-color 200ms ease,
    background 200ms ease;
}

.event-card:hover .info-card {
  border-color: rgba(200, 255, 94, 0.22);
  background: rgba(17, 20, 29, 0.96);
}

.event-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.meta-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  color: var(--muted-soft);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.meta-item time {
  color: #cfd4de;
  font-family: var(--font-mono);
  font-size: 9.5px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.meta-separator {
  width: 1px;
  height: 20px;
  margin: 0 2px;
  background: var(--line);
}

.event-title {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--text);
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.25;
  text-wrap: pretty;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.event-description {
  display: -webkit-box;
  overflow: hidden;
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.55;
  text-wrap: pretty;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.topic-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.topic-chip {
  padding: 3px 8px;
  border: 1px solid rgba(200, 255, 94, 0.16);
  border-radius: 999px;
  background: rgba(200, 255, 94, 0.055);
  color: #d9f5a4;
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.event-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 2px;
}

.involved {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.avatar-stack {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.avatar {
  display: grid;
  width: 20px;
  height: 20px;
  margin-left: -5px;
  place-items: center;
  border: 1px solid;
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 7px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.avatar:first-child {
  margin-left: 0;
}

.avatar-more {
  border-color: var(--line);
  background: #1a1d27;
  color: var(--muted);
}

.involved-names {
  overflow: hidden;
  color: var(--muted-soft);
  font-size: 9.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-link {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  color: var(--muted-soft);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.03em;
  text-transform: lowercase;
  transition: color 140ms ease;
}

.source-link:hover {
  color: var(--accent);
}

.source-arrow {
  font-size: 10px;
}

@media (max-height: 840px) {
  .info-card {
    gap: 7px;
    padding: 12px 14px 11px;
  }

  .event-title {
    font-size: 16px;
  }

  .event-description {
    font-size: 11.5px;
    line-height: 1.5;
    -webkit-line-clamp: 2;
  }
}

@media (max-height: 720px) {
  .info-card {
    gap: 6px;
    padding: 11px 13px 10px;
  }

  .event-title {
    font-size: 15px;
  }

  .event-description {
    -webkit-line-clamp: 1;
  }

  .topic-chip {
    padding: 2px 7px;
  }

  .avatar {
    width: 18px;
    height: 18px;
  }
}
</style>
