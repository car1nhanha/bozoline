<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import EventCard from './EventCard.vue'
import { buildAxisScale } from '../lib/axis'
import { DAY_MS, formatRange, parseTimelineDate } from '../lib/dates'
import { getTimelineBounds, placeEvents } from '../lib/layout'
import type { TimelineData } from '../types'

const props = defineProps<{ data: TimelineData }>()

const CARD_GAP = 26
const ZOOM_RANGE_MULTIPLIER = 3
const MAX_SCALE = 140 * ZOOM_RANGE_MULTIPLIER
const MIN_SCALE_RATIO = 0.85 / ZOOM_RANGE_MULTIPLIER
const MIN_ABS_SCALE = 0.001
const SMALL_SCREEN = 720

const stage = ref<HTMLDivElement | null>(null)
const viewportWidth = ref(0)
const pxPerDay = ref(1)
const offset = ref(0)
const dragging = ref(false)
const initialized = ref(false)

const bounds = computed(() =>
  getTimelineBounds(props.data.events, props.data.markers),
)
const spanDays = computed(() => bounds.value.spanDays)
const cardWidth = computed(() => (viewportWidth.value < 680 ? 264 : 304))
const leftPad = computed(() => cardWidth.value / 2 + 48)
const rightPad = computed(() => leftPad.value + 24)
const contentWidth = computed(
  () => leftPad.value + rightPad.value + spanDays.value * pxPerDay.value,
)
const fitScale = computed(() => {
  const available = Math.max(
    140,
    viewportWidth.value - leftPad.value - rightPad.value,
  )
  return available / spanDays.value
})
const minScale = computed(() =>
  Math.max(MIN_ABS_SCALE, fitScale.value * MIN_SCALE_RATIO),
)
const zoomLabel = computed(
  () => `${(pxPerDay.value / fitScale.value).toFixed(1).replace('.', ',')}×`,
)
const rangeLabel = computed(() =>
  formatRange(bounds.value.startTime, bounds.value.endTime),
)
const eventCountLabel = computed(() => {
  const count = props.data.events.length
  return `${count} ${count === 1 ? 'evento' : 'eventos'}`
})

const placements = computed(() =>
  placeEvents(props.data.events, {
    startTime: bounds.value.startTime,
    pxPerDay: pxPerDay.value,
    leftPad: leftPad.value,
    cardWidth: cardWidth.value,
    gap: CARD_GAP,
  }),
)
const visiblePlacements = computed(() =>
  placements.value.filter((placement) => placement.visible),
)
const hiddenPlacements = computed(() =>
  placements.value.filter((placement) => !placement.visible),
)
const markerPlacements = computed(() =>
  [...props.data.markers]
    .map((marker) => ({
      ...marker,
      time: parseTimelineDate(marker.date),
    }))
    .sort((a, b) => a.time - b.time),
)

const AXIS_BLEED = 80

function timeAtScreenX(screenX: number): number {
  const worldX = screenX - offset.value
  return (
    bounds.value.startTime +
    ((worldX - leftPad.value) / pxPerDay.value) * DAY_MS
  )
}

const axisWindow = computed(() => ({
  start: timeAtScreenX(-AXIS_BLEED),
  end: timeAtScreenX(viewportWidth.value + AXIS_BLEED),
}))

const axisScale = computed(() =>
  buildAxisScale(axisWindow.value.start, axisWindow.value.end, pxPerDay.value),
)

const axisRuleStyle = computed(() => ({
  left: `${-offset.value - AXIS_BLEED}px`,
  width: `${viewportWidth.value + AXIS_BLEED * 2}px`,
}))

function xForTime(time: number): number {
  return (
    leftPad.value +
    ((time - bounds.value.startTime) / DAY_MS) * pxPerDay.value
  )
}

const displayYears = computed(() => {
  const times = new Set<number>()
  let lastX = Number.NEGATIVE_INFINITY

  for (const year of axisScale.value.years) {
    const x = xForTime(year.time) + offset.value
    if (x < 190 || x > viewportWidth.value - 110) continue
    if (x - lastX < 110) continue
    times.add(year.time)
    lastX = x
  }

  return times
})

function fitView(): void {
  pxPerDay.value = fitScale.value
  offset.value = (viewportWidth.value - contentWidth.value) / 2
}

function focusLatest(): void {
  const preferred = Math.max(fitScale.value * 3, 2.4)
  pxPerDay.value = Math.min(MAX_SCALE, Math.max(minScale.value, preferred))
  const latestX =
    leftPad.value +
    ((bounds.value.endTime - bounds.value.startTime) / DAY_MS) *
      pxPerDay.value
  offset.value = viewportWidth.value * 0.5 - latestX
}

function zoomAt(factor: number, clientX?: number): void {
  const previous = pxPerDay.value
  const next = Math.min(
    MAX_SCALE,
    Math.max(minScale.value, previous * factor),
  )
  if (Math.abs(next - previous) < 1e-6) return

  const rect = stage.value?.getBoundingClientRect()
  const rawAnchor =
    clientX === undefined
      ? viewportWidth.value / 2
      : clientX - (rect?.left ?? 0)
  const anchor = Math.min(viewportWidth.value, Math.max(0, rawAnchor))
  const contentX = anchor - offset.value
  const nextOffset = anchor - contentX * (next / previous)

  pxPerDay.value = next
  offset.value = nextOffset
}

function panBy(direction: number): void {
  offset.value += direction * viewportWidth.value * 0.28
}

let dragStartX = 0
let dragStartOffset = 0
let dragMoved = false
let activePointer: number | null = null
let suppressClick = false

function onPointerDown(event: PointerEvent): void {
  if (event.button !== 0 || !stage.value) return
  const target = event.target
  if (target instanceof Element && target.closest('a, button, .no-drag')) return

  activePointer = event.pointerId
  dragStartX = event.clientX
  dragStartOffset = offset.value
  dragMoved = false
  dragging.value = true
  stage.value.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent): void {
  if (!dragging.value || activePointer !== event.pointerId) return
  const delta = event.clientX - dragStartX
  if (Math.abs(delta) > 4) dragMoved = true
  offset.value = dragStartOffset + delta
}

function endDrag(event: PointerEvent): void {
  if (activePointer !== event.pointerId) return
  dragging.value = false
  activePointer = null
  if (stage.value?.hasPointerCapture(event.pointerId)) {
    stage.value.releasePointerCapture(event.pointerId)
  }
  if (dragMoved) {
    suppressClick = true
    window.setTimeout(() => {
      suppressClick = false
    }, 0)
  }
}

function onClickCapture(event: MouseEvent): void {
  if (!suppressClick) return
  event.preventDefault()
  event.stopPropagation()
  suppressClick = false
}

function onWheel(event: WheelEvent): void {
  event.preventDefault()

  const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY)
  if (horizontal && !event.ctrlKey && !event.metaKey) {
    offset.value -= event.deltaX
    return
  }

  if (event.deltaY === 0) return

  const unit =
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? 16
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? viewportWidth.value
        : 1
  const factor = Math.exp(-event.deltaY * unit * 0.0025)
  zoomAt(factor, event.clientX)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.metaKey || event.ctrlKey || event.altKey) return
  const target = event.target
  if (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable)
  ) {
    return
  }

  switch (event.key) {
    case '+':
    case '=':
      zoomAt(1.45)
      break
    case '-':
    case '_':
      zoomAt(1 / 1.45)
      break
    case '0':
      fitView()
      break
    case 'ArrowLeft':
      panBy(1)
      break
    case 'ArrowRight':
      panBy(-1)
      break
    default:
      return
  }

  event.preventDefault()
}

function readViewport(): number {
  return stage.value?.clientWidth ?? 0
}

function handleResize(): void {
  const nextWidth = readViewport()
  if (nextWidth <= 0 || nextWidth === viewportWidth.value) return

  const previousWidth = viewportWidth.value
  viewportWidth.value = nextWidth
  if (!initialized.value) return

  if (pxPerDay.value < fitScale.value * MIN_SCALE_RATIO) {
    pxPerDay.value = fitScale.value
  }
  if (pxPerDay.value > MAX_SCALE) pxPerDay.value = MAX_SCALE

  const centerShift = (nextWidth - previousWidth) / 2
  offset.value -= centerShift
}

let resizeObserver: ResizeObserver | null = null
let rafId = 0

onMounted(() => {
  viewportWidth.value = readViewport()

  const start = (): void => {
    viewportWidth.value = readViewport()
    if (viewportWidth.value <= 0) {
      rafId = window.requestAnimationFrame(start)
      return
    }
    if (viewportWidth.value < SMALL_SCREEN) {
      focusLatest()
    } else {
      fitView()
    }
    initialized.value = true
  }

  if (viewportWidth.value > 0) {
    start()
  } else {
    rafId = window.requestAnimationFrame(start)
  }

  resizeObserver = new ResizeObserver(handleResize)
  if (stage.value) {
    resizeObserver.observe(stage.value)
    stage.value.addEventListener('wheel', onWheel, { passive: false })
  }
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  stage.value?.removeEventListener('wheel', onWheel)
  window.removeEventListener('keydown', onKeydown)
  window.cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="timeline-shell">
    <div
      ref="stage"
      class="timeline-stage"
      :class="{ 'is-dragging': dragging }"
      title="Arraste para navegar · deslize dois dedos na vertical para dar zoom"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="endDrag"
      @pointercancel="endDrag"
      @click.capture="onClickCapture"
      @dragstart.prevent
    >
      <div
        class="timeline-track"
        :style="{
          width: `${contentWidth}px`,
          transform: `translate3d(${offset}px, 0, 0)`,
        }"
      >
        <div
          v-for="year in axisScale.years"
          :key="`year-${year.label}`"
          class="year-band"
          :style="{ left: `${xForTime(year.time)}px` }"
        >
          <span v-if="displayYears.has(year.time)" class="year-label">{{ year.label }}</span>
        </div>

        <div
          class="axis-rule"
          :style="axisRuleStyle"
        />

        <div
          v-for="tick in axisScale.ticks"
          :key="`tick-${tick.time}`"
          class="axis-tick"
          :style="{ left: `${xForTime(tick.time)}px` }"
        >
          <span class="tick-mark" />
        </div>

        <div
          v-for="marker in markerPlacements"
          :key="`marker-${marker.id}`"
          class="timeline-marker"
          :style="{ left: `${xForTime(marker.time)}px` }"
        >
          <span class="timeline-marker-line" />
          <span class="timeline-marker-label" :title="marker.title">
            {{ marker.title }}
          </span>
        </div>

        <div
          v-for="placement in hiddenPlacements"
          :key="`hidden-${placement.event.id}`"
          class="hidden-marker"
          :style="{ left: `${placement.centerX}px` }"
          :title="`${placement.event.title} — oculto neste nível de zoom`"
        >
          <span class="hidden-dot" />
        </div>

        <div
          v-for="placement in visiblePlacements"
          :key="`event-${placement.event.id}`"
          class="event-anchor"
          :class="`is-${placement.lane}`"
          :style="{
            left: `${placement.centerX}px`,
            width: `${cardWidth}px`,
          }"
        >
          <span class="event-stem" />
          <span class="event-dot" />
          <div class="event-position">
            <EventCard
              :event="placement.event"
              :entities="data.entities"
              :topics="data.topics"
            />
          </div>
        </div>
      </div>

      <div v-if="data.events.length === 0" class="empty-state">
        <p class="empty-kicker">Linha do tempo vazia</p>
        <h2>Nenhum evento ainda</h2>
        <p>Adicione entradas em <code>src/data/timeline.json</code>.</p>
      </div>

      <div class="brand" :title="`${eventCountLabel} · ${rangeLabel}`">
        <div class="brand-mark" aria-hidden="true">
          <span class="brand-dot brand-dot-a" />
          <span class="brand-line" />
          <span class="brand-dot brand-dot-b" />
        </div>
        <div class="brand-copy">
          <h1>bolsoline</h1>
        </div>
      </div>

      <div
        class="zoom-ui no-drag"
        role="group"
        aria-label="Zoom da linha do tempo"
        :title="`${zoomLabel} de zoom`"
      >
        <button
          v-if="hiddenPlacements.length > 0"
          type="button"
          class="hidden-button"
          :title="`${hiddenPlacements.length} eventos ocultos neste zoom — clique para ampliar`"
          @click="zoomAt(1.8)"
        >
          <span class="hidden-pulse" />
          {{ hiddenPlacements.length }}
        </button>
        <span v-if="hiddenPlacements.length > 0" class="zoom-divider" />
        <button
          type="button"
          class="zoom-button"
          aria-label="Diminuir zoom"
          @click="zoomAt(1 / 1.45)"
        >
          −
        </button>
        <button
          type="button"
          class="zoom-button"
          aria-label="Aumentar zoom"
          @click="zoomAt(1.45)"
        >
          +
        </button>
        <span class="zoom-divider" />
        <button type="button" class="fit-button" @click="fitView">Ajustar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-shell,
.timeline-stage {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.timeline-stage {
  --axis-y: 50%;
  --axis-gap: 38px;
  --media-height: clamp(124px, 16.5vh, 152px);
  cursor: grab;
  touch-action: none;
  user-select: none;
  isolation: isolate;
}

.timeline-stage.is-dragging {
  cursor: grabbing;
}

.timeline-track {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  will-change: transform;
}

.year-band {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: rgba(255, 255, 255, 0.11);
  pointer-events: none;
}

.year-label {
  position: absolute;
  top: 44px;
  left: 14px;
  color: rgba(255, 255, 255, 0.075);
  font-size: 42px;
  font-weight: 600;
  letter-spacing: -0.05em;
  line-height: 1;
}

.axis-rule {
  position: absolute;
  top: var(--axis-y);
  height: 1px;
  background: rgba(255, 255, 255, 0.28);
}

.axis-tick {
  position: absolute;
  top: var(--axis-y);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  transform: translateX(-50%);
  pointer-events: none;
}

.tick-mark {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.035);
}

.timeline-marker {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  transform: translateX(-50%);
  pointer-events: none;
}

.timeline-marker-line {
  position: absolute;
  inset: 0;
  width: 1px;
  background: rgba(200, 255, 94, 0.2);
}

.timeline-marker-label {
  position: absolute;
  bottom: calc(50% + 4px);
  left: 50%;
  max-width: min(260px, 70vw);
  overflow: hidden;
  padding: 3px 8px;
  border: 1px solid rgba(200, 255, 94, 0.24);
  border-radius: 7px;
  background: #0b0d13;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  transform: translateX(-50%);
}

.event-anchor {
  position: absolute;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  pointer-events: none;
}

.event-stem {
  position: absolute;
  left: 50%;
  width: 1px;
  height: var(--axis-gap);
}

.event-anchor.is-below .event-stem {
  top: 50%;
  background: rgba(200, 255, 94, 0.38);
}

.event-anchor.is-above .event-stem {
  bottom: 50%;
  background: rgba(200, 255, 94, 0.38);
}

.event-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 9px;
  height: 9px;
  border: 2px solid #0a0b10;
  border-radius: 50%;
  background: var(--accent);
  box-shadow:
    0 0 0 4px rgba(200, 255, 94, 0.12),
    0 0 18px rgba(200, 255, 94, 0.45);
  transform: translate(-50%, -50%);
}

.event-position {
  position: absolute;
  left: 0;
  width: 100%;
  pointer-events: auto;
}

.event-anchor.is-below .event-position {
  top: calc(50% + var(--axis-gap));
  padding-bottom: 28px;
}

.event-anchor.is-above .event-position {
  bottom: calc(50% + var(--axis-gap));
}

.hidden-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  cursor: help;
}

.hidden-dot {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.24);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.03);
  transition:
    background 160ms ease,
    box-shadow 160ms ease;
}

.hidden-marker:hover .hidden-dot {
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(200, 255, 94, 0.14);
}

.brand {
  position: absolute;
  top: 26px;
  left: 28px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 8px 13px 8px 11px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(10, 12, 18, 0.82);
  box-shadow:
    0 12px 34px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(16px);
  pointer-events: none;
}

.brand-mark {
  display: flex;
  align-items: center;
  gap: 4px;
}

.brand-dot {
  display: block;
  border-radius: 50%;
}

.brand-dot-a {
  width: 8px;
  height: 8px;
  background: var(--accent);
  box-shadow: 0 0 14px rgba(200, 255, 94, 0.55);
}

.brand-dot-b {
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.55);
}

.brand-line {
  display: block;
  width: 26px;
  height: 1px;
  background: var(--accent);
}

.brand-copy h1 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1.1;
}

.zoom-ui {
  position: absolute;
  right: 28px;
  bottom: 26px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 5px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(13, 15, 22, 0.86);
  box-shadow:
    0 16px 40px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.045);
  backdrop-filter: blur(16px);
  cursor: default;
}

.hidden-button {
  display: flex;
  height: 32px;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border-radius: 9px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  transition:
    background 150ms ease,
    color 150ms ease;
}

.hidden-button:hover {
  background: var(--accent-dim);
  color: var(--accent);
}

.zoom-button {
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 9px;
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 17px;
  line-height: 1;
  transition: background 150ms ease;
}

.zoom-button:hover {
  background: rgba(255, 255, 255, 0.07);
}

.zoom-divider {
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: var(--line);
}

.fit-button {
  height: 32px;
  padding: 0 12px;
  border-radius: 9px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition:
    background 150ms ease,
    color 150ms ease;
}

.fit-button:hover {
  background: var(--accent-dim);
  color: var(--accent);
}

.hidden-pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 4px rgba(200, 255, 94, 0.1);
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  text-align: center;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.empty-kicker {
  margin: 0 0 8px;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.empty-state h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.04em;
}

.empty-state p:last-child {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 13px;
}

.empty-state code {
  padding: 2px 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  font-family: var(--font-mono);
}

@media (max-height: 840px) {
  .timeline-stage {
    --axis-gap: 32px;
    --media-height: 132px;
  }

  .year-label {
    top: 30px;
    font-size: 34px;
  }
}

@media (max-height: 720px) {
  .timeline-stage {
    --axis-gap: 26px;
    --media-height: 112px;
  }

  .year-label {
    top: 20px;
    font-size: 28px;
  }
}

@media (max-width: 720px) {
  .brand {
    top: 16px;
    left: 16px;
    gap: 9px;
    padding: 7px 10px;
  }

  .brand-line {
    width: 18px;
  }

  .zoom-ui {
    right: 16px;
    bottom: 16px;
  }

  .fit-button {
    padding: 0 9px;
  }
}
</style>
