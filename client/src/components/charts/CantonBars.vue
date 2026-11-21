<script setup lang="ts">
import { computed } from 'vue'
import { descending, max, scaleLinear } from 'd3'
import { fmtNum } from '@/lib/format'
import type { CantonCount } from '@/lib/types'

/** Job ads per canton. Each bar is a toggle button: click to filter the page to that canton. */
const props = defineProps<{ cantons: CantonCount[]; selected: string }>()
const emit = defineEmits<{ pick: [canton: string] }>()

const sorted = computed(() => [...props.cantons].sort((a, b) => descending(a.count, b.count)))
const x = computed(() => scaleLinear().domain([0, max(sorted.value, (c) => c.count) || 1]).range([0, 100]))
</script>

<template>
  <ul class="bars" aria-label="Job ads by canton. Select a canton to filter the page.">
    <li v-for="(c, i) in sorted" :key="c.canton">
      <button
        type="button"
        class="bar-row bar-btn has-tip"
        :aria-pressed="c.canton === selected"
        :aria-label="`${c.canton}: ${fmtNum(c.count)} job ads. ${c.canton === selected ? 'Selected. Press to show all of Switzerland' : 'Press to show only ' + c.canton}`"
        @click="emit('pick', c.canton)"
      >
        <span class="bar-name">{{ c.canton }}</span>
        <span class="bar-track">
          <span :class="['bar-fill', 'grow-x', { sel: c.canton === selected }]" :style="{ width: x(c.count) + '%', '--i': i }">
            <span class="tip tip-in" aria-hidden="true">{{ c.canton === selected ? 'Click to show all of Switzerland' : 'Click to show only ' + c.canton }}</span>
          </span>
        </span>
        <span class="bar-val num">{{ fmtNum(c.count) }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.bars { display: flex; flex-direction: column; gap: 2px; }
.bar-row {
  display: grid; grid-template-columns: 180px minmax(0, 1fr) 92px; gap: 12px; align-items: center;
  min-height: 36px; padding: 0 var(--space-2); font-size: 15px; transition: background-color .12s, opacity .15s;
}
.bar-btn {
  width: calc(100% + 16px); margin: 0 calc(-1 * var(--space-2)); color: var(--color-text); text-align: left;
  background: transparent; border: 0; cursor: pointer;
}
.bars:hover .bar-btn { opacity: .45; }
.bars:hover .bar-btn:hover { opacity: 1; }
.bar-btn:hover { background: var(--color-bg); }
.bar-btn[aria-pressed="true"] { background: var(--color-action-subtle); box-shadow: inset 3px 0 0 var(--color-action); }
.bar-btn:hover .bar-fill:not(.sel), .bar-btn:focus-visible .bar-fill:not(.sel) { background: var(--color-text); }
.bar-btn:hover .bar-val, .bar-btn[aria-pressed="true"] .bar-val { color: var(--color-text); }
.bar-btn[aria-pressed="true"] .bar-name { color: var(--color-action-strong); font-weight: 700; }
.bar-track { height: 12px; background: var(--color-bg); }
.bar-btn:hover .bar-track { background: var(--color-surface); }
.bar-fill { position: relative; display: block; height: 12px; background: var(--color-text-muted); transition: width .5s var(--ease-out), background-color .15s; }
.bar-fill.sel { background: var(--color-action); }
.bar-fill .tip { left: 100%; }
.bar-val { display: flex; justify-content: flex-end; font-size: 14px; font-weight: 700; color: var(--color-text-muted); transition: color .15s; }
@media (max-width: 639px) {
  .bar-row { grid-template-columns: 100px minmax(0, 1fr) 64px; gap: var(--space-2); font-size: 14px; }
}
</style>
