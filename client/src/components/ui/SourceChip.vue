<script setup lang="ts">
import { computed } from 'vue'
import { fmtDate, isExternalUrl } from '@/lib/format'
import { useSnapshot } from '@/composables/useSnapshot'

/** "Source: Adzuna · 20 Nov 2026" with a fresh/outdated dot. Names must match snapshot.sources[].name. */
const props = defineProps<{ names: string[]; href?: string; date?: string }>()
const { sourceByName, isOutdated } = useSnapshot()

const items = computed(() =>
  props.names.map((n, i) => {
    const src = sourceByName(n)
    return {
      name: n,
      url: props.href && i === 0 ? props.href : src && isExternalUrl(src.url) ? src.url : '',
      date: props.date && i === 0 ? fmtDate(props.date.slice(0, 10)) : src ? fmtDate(src.lastUpdate) : '',
      old: src ? isOld(src.lastUpdate) : false,
    }
  }),
)
const anyOld = computed(() => isOutdated.value || items.value.some((i) => i.old))
const latest = computed(() => items.value.map((i) => i.date).filter(Boolean)[0] ?? '')

function isOld(iso: string) {
  return (Date.now() - new Date(iso + 'T00:00:00').getTime()) / 86_400_000 > 30
}
</script>

<template>
  <p class="chip">
    <span :class="['dot', anyOld ? 'dot-old' : 'dot-fresh']" aria-hidden="true" />
    <span class="sr">{{ anyOld ? 'Outdated data.' : 'Fresh data.' }}</span>
    <span>
      Source:
      <template v-for="(it, i) in items" :key="it.name">
        <a v-if="it.url" :href="it.url" target="_blank" rel="noopener noreferrer">{{ it.name }}</a>
        <template v-else>{{ it.name }}</template>{{ i < items.length - 1 ? ' + ' : '' }}
      </template>
    </span>
    <template v-if="latest"><span class="sep" aria-hidden="true">·</span><span>{{ latest }}</span></template>
  </p>
</template>

<style scoped>
.chip {
  display: inline-flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); align-self: flex-start;
  min-height: 32px; padding: 6px 10px; border: var(--border) solid var(--color-border);
  background: var(--color-surface); font-size: 14px; line-height: 20px; transition: border-color .12s;
}
.chip:hover { border-color: var(--color-border-strong); }
.sep { color: var(--color-border-strong); }
.dot { width: 8px; height: 8px; flex: none; }
.dot-fresh { background: var(--color-success); }
.dot-old { background: var(--color-warning); }
</style>
