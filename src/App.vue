<script setup lang="ts">
import { computed } from 'vue'
import Timeline from './components/Timeline.vue'
import { loadTimelineInput } from './lib/timelineData'
import { parseTimelineData, TimelineDataError } from './lib/validation'
import type { TimelineData } from './types'

interface LoadResult {
  data: TimelineData | null
  error: string | null
}

const result = computed<LoadResult>(() => {
  try {
    return { data: parseTimelineData(loadTimelineInput()), error: null }
  } catch (error) {
    if (error instanceof TimelineDataError) {
      return { data: null, error: error.message }
    }
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Erro desconhecido ao carregar os dados da linha do tempo.',
    }
  }
})
</script>

<template>
  <main class="app-shell">
    <Timeline v-if="result.data" :data="result.data" />
    <section v-else class="load-error" role="alert">
      <p class="load-error-eyebrow">bolsoline</p>
      <h1>Não foi possível carregar a linha do tempo</h1>
      <p class="load-error-message">{{ result.error }}</p>
      <p class="load-error-hint">
        Verifique os arquivos <code>src/data/timeline.meta.json</code> e <code>src/data/events-*.json</code>.
      </p>
    </section>
  </main>
</template>

<style scoped>
.app-shell {
  height: 100dvh;
  width: 100%;
  overflow: hidden;
}

.load-error {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  padding: 8vw;
  background: #07080c;
}

.load-error-eyebrow {
  margin: 0;
  color: var(--accent);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.load-error h1 {
  margin: 0;
  font-size: clamp(28px, 5vw, 48px);
  font-weight: 600;
  letter-spacing: -0.04em;
}

.load-error-message {
  max-width: 640px;
  margin: 0;
  color: #ffb4b4;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
}

.load-error-hint {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.load-error-hint code {
  padding: 2px 6px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  font-family: var(--font-mono);
}
</style>
