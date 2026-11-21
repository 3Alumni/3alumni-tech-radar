<script setup lang="ts">
import Icon from './Icon.vue'
import { ICON } from '@/lib/format'

/**
 * Loading (skeleton) and empty states for a card.
 * `lines` sets skeleton bar widths (%) and `lineHeight` their height in px.
 */
withDefaults(
  defineProps<{ state: 'loading' | 'empty'; lines?: number[]; lineHeight?: number }>(),
  { lines: () => [90, 70, 50], lineHeight: 14 },
)
</script>

<template>
  <div v-if="state === 'loading'" class="skel-box" aria-busy="true">
    <div
      v-for="(w, i) in lines"
      :key="i"
      class="skel"
      :style="{ width: w + '%', height: lineHeight + 'px' }"
    />
    <span class="small muted" role="status">Loading data…</span>
  </div>
  <p v-else class="alert al-empty">
    <Icon :path="ICON.empty" />
    <span><slot><b>No data yet.</b> Check again after the next data update.</slot></span>
  </p>
</template>

<style scoped>
.skel-box { display: flex; flex-direction: column; gap: 12px; padding: var(--space-2) 0; }
.skel { background: var(--color-border); }
.alert { display: flex; gap: 10px; align-items: flex-start; padding: 12px 16px; border: var(--border) solid; font-size: 14px; line-height: 20px; }
.al-empty { background: var(--color-bg); border-color: var(--color-border); }
</style>
