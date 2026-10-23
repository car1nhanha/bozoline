<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import TweetEmbed from './TweetEmbed.vue'
import type { TimelineEvent } from '../types'
import { eventImage, eventImageAlt } from '../lib/eventContent'
import { displaySource } from '../lib/links'
import { extractTweetId } from '../lib/twitter'

const props = defineProps<{ event: TimelineEvent }>()

const tweetId = computed(() => extractTweetId(props.event.link))
const tweetFailed = ref(false)
const showTweet = computed(() => tweetId.value !== null && !tweetFailed.value)

const image = computed(() => eventImage(props.event))
const imageAlt = computed(() => eventImageAlt(props.event))
const site = computed(() =>
  displaySource(props.event.link, props.event.preview?.site),
)
const linkAttrs = computed(() =>
  props.event.link
    ? {
        href: props.event.link,
        target: '_blank',
        rel: 'noopener noreferrer',
      }
    : {},
)

function onTweetFailed(): void {
  tweetFailed.value = true
}

watch(
  () => props.event.id,
  () => {
    tweetFailed.value = false
  },
)
</script>

<template>
  <div v-if="showTweet || image" class="media-card" :class="{ 'is-tweet': showTweet }">
    <TweetEmbed
      v-if="showTweet && tweetId"
      :tweet-id="tweetId"
      @failed="onTweetFailed"
    />

    <component
      :is="event.link ? 'a' : 'div'"
      v-else
      class="media-link"
      :class="{ 'is-static': !event.link }"
      v-bind="linkAttrs"
      :title="event.link ? `Abrir ${site}` : undefined"
    >
      <img
        class="media-image"
        :src="image"
        :alt="imageAlt"
        loading="lazy"
        decoding="async"
        draggable="false"
      />

      <span v-if="site" class="media-site">{{ site }}</span>
      <span v-if="event.link" class="media-open" aria-hidden="true">↗</span>
    </component>
  </div>
</template>

<style scoped>
.media-card {
  position: relative;
  width: 100%;
  height: var(--media-height, 172px);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: #0b0d13;
  box-shadow:
    0 20px 44px rgba(0, 0, 0, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;
}

.media-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow:
    0 24px 52px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.07);
}

.media-card.is-tweet {
  height: auto;
  padding: 0;
  background: #0b0d13;
}

.media-link {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.media-link.is-static {
  cursor: default;
}

.media-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 600ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.media-card:hover .media-image {
  transform: scale(1.04);
}

.media-site {
  position: absolute;
  bottom: 11px;
  left: 12px;
  max-width: calc(100% - 58px);
  overflow: hidden;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 999px;
  background: rgba(7, 8, 12, 0.82);
  color: rgba(255, 255, 255, 0.78);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  backdrop-filter: blur(10px);
}

.media-open {
  position: absolute;
  top: 11px;
  right: 11px;
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 50%;
  background: rgba(7, 8, 12, 0.5);
  color: rgba(255, 255, 255, 0.82);
  font-size: 11px;
  backdrop-filter: blur(10px);
  transition:
    background 160ms ease,
    color 160ms ease;
}

.media-link:hover .media-open {
  background: var(--accent);
  color: #0a0b10;
}
</style>
