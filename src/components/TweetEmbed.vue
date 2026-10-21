<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { loadTwitterWidgets } from '../lib/twitter'

const props = defineProps<{ tweetId: string }>()
const emit = defineEmits<{ failed: [] }>()

const host = ref<HTMLDivElement | null>(null)
const loading = ref(true)

async function render(): Promise<void> {
  const target = host.value
  if (!target) return

  target.replaceChildren()
  loading.value = true

  try {
    const api = await loadTwitterWidgets()
    const width = Math.min(
      520,
      Math.max(220, Math.round(target.clientWidth || 300)),
    )
    const element = await api.widgets.createTweet(props.tweetId, target, {
      theme: 'dark',
      dnt: true,
      align: 'center',
      conversation: 'none',
      width,
      lang: 'pt',
    })

    if (!element) {
      emit('failed')
    }
  } catch {
    emit('failed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void render()
})

watch(
  () => props.tweetId,
  () => {
    void render()
  },
)
</script>

<template>
  <div class="tweet-media" :class="{ 'is-loading': loading }">
    <div ref="host" class="tweet-host" />

    <div v-if="loading" class="tweet-skeleton" aria-hidden="true">
      <div class="skeleton-head">
        <span class="skeleton-avatar" />
        <span class="skeleton-line skeleton-short" />
      </div>
      <span class="skeleton-line" />
      <span class="skeleton-line skeleton-medium" />
      <span class="skeleton-box" />
    </div>
  </div>
</template>

<style scoped>
.tweet-media {
  position: relative;
  width: 100%;
}

.tweet-media.is-loading {
  min-height: 190px;
}

.tweet-host {
  width: 100%;
}

.tweet-host :deep(.twitter-tweet-rendered) {
  margin: 0 auto !important;
}

.tweet-host :deep(iframe) {
  display: block;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  border-radius: 18px;
}

.tweet-skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: #0b0d13;
}

.skeleton-head {
  display: flex;
  align-items: center;
  gap: 9px;
}

.skeleton-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
}

.skeleton-line {
  display: block;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}

.skeleton-short {
  width: 38%;
}

.skeleton-medium {
  width: 72%;
}

.skeleton-box {
  margin-top: 4px;
  flex: 1;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.035);
}
</style>
