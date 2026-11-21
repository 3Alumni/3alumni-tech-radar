<script setup lang="ts">
import { computed } from 'vue'
import { descending, max, scaleLinear } from 'd3'
import { fmtNum } from '@/lib/format'
import { shadeLevel } from '@/lib/shade'
import type { CantonCount } from '@/lib/types'

/**
 * Job ads per canton. Each bar is a toggle button: click to filter the page to that canton.
 * Bars use the same red shade as the canton on the map (shared shadeLevel), so list and map read as one.
 */
const props = defineProps<{ cantons: CantonCount[]; selected: string }>()
const emit = defineEmits<{ pick: [canton: string] }>()

const sorted = computed(() => [...props.cantons].sort((a, b) => descending(a.count, b.count)))
const top = computed(() => max(sorted.value, (c) => c.count) || 1)
const x = computed(() => scaleLinear().domain([0, top.value]).range([0, 100]))
const level = computed(() => shadeLevel(top.value))
</script>

<template>
  <ul class="bars" aria-label="Jobs by canton. Select a canton to filter the page.">
    <li v-for="(c, i) in sorted" :key="c.canton">
      <button
        type="button"
        class="bar-row bar-btn has-tip"
        :aria-pressed="c.canton === selected"
        :aria-label="`${c.canton}: ${fmtNum(c.count)} jobs. ${c.canton === selected ? 'Selected. Press to show all of Switzerland' : 'Press to show only ' + c.canton}`"
        @click="emit('pick', c.canton)"
      >
        <span class="bar-name">{{ c.canton }}</span>
        <span class="bar-track">
          <span
            :class="['bar-fill', 'grow-x', `shade-${level(c.count)}`, { sel: c.canton === selected }]"
            :style="{ width: x(c.count) + '%', '--i': i }"
          >
            <span class="tip tip-in" aria-hidden="true">{{ c.canton === selected ? 'Click to show all of Switzerland' : 'Click to show only ' + c.canton }}</span>
          </span>
        </span>
        <span class="bar-val num">{{ fmtNum(c.count) }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.bars { display: flex; flex-direction: column; gap: 4px; }
.bar-row {
  display: grid; grid-template-columns: minmax(120px, 180px) minmax(0, 1fr) 56px; gap: 16px; align-items: center;
  min-height: 40px; padding: 0 var(--space-2); font-size: 15px;
  transition: background-color .15s, opacity .15s;
}
.bar-btn {
  width: calc(100% + 16px); margin: 0 calc(-1 * var(--space-2)); color: var(--color-text); text-align: left;
  background: transparent; border: 0; cursor: pointer;
}
.bar-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Track + fill: colour = map level (.shade-N in base.css) */
.bar-track { position: relative; height: 12px; background: var(--color-bg); }
.bar-fill {
  position: relative; display: block; height: 100%; min-width: 4px;
  transition: width .5s var(--ease-out), background-color .15s, box-shadow .15s;
}
.bar-fill .tip { left: 100%; }

.bar-val { display: flex; justify-content: flex-end; font-size: 15px; font-weight: 600; color: var(--color-text-muted); transition: color .15s; }

/* Hover: dim siblings, lift the hovered row */
.bars:hover .bar-btn { opacity: .5; }
.bars:hover .bar-btn:hover { opacity: 1; }
.bar-btn:hover { background: var(--color-bg); }
.bar-btn:hover .bar-track { background: var(--color-surface); }
.bar-btn:hover .bar-val, .bar-btn:focus-visible .bar-val { color: var(--color-text); }
.bar-btn:hover .bar-fill, .bar-btn:focus-visible .bar-fill { box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 3px var(--color-red-3); }

/* Selected */
.bar-btn[aria-pressed="true"] { background: var(--color-action-subtle); box-shadow: inset 3px 0 0 var(--color-action); }
.bar-btn[aria-pressed="true"] .bar-name { color: var(--color-action-strong); font-weight: 700; }
.bar-btn[aria-pressed="true"] .bar-val { color: var(--color-action-strong); font-weight: 700; }
.bar-btn[aria-pressed="true"] .bar-track { background: var(--color-surface); }

@media (max-width: 639px) {
  .bar-row { grid-template-columns: 100px minmax(0, 1fr) 44px; gap: var(--space-2); font-size: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .bar-fill { transition: none; }
}
</style>
