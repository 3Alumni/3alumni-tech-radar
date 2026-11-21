<script setup lang="ts">
import { computed } from 'vue'
import { max, scaleLinear } from 'd3'
import Icon from '@/components/ui/Icon.vue'
import { ICON } from '@/lib/format'
import { shadeLevel } from '@/lib/shade'
import type { Trend } from '@/lib/types'

/** A bar needs a share. Trend is optional: the live skills page has only one reading. */
export interface BarSkill {
  name: string
  sharePct: number
  mentions?: number
  trend?: Trend
}

/**
 * Inline bar list: skill · bar on a track · share + trend.
 * Bars are shaded red by share (shared shadeLevel, same steps as the canton map);
 * the `highlight` skill (fastest riser) gets an outline ring and a bold name.
 * `compact` = Overview widget.
 */
const props = withDefaults(
  defineProps<{ skills: BarSkill[]; roleLabel: string; ads?: number; highlight?: string; compact?: boolean }>(),
  { highlight: '', compact: false, ads: 0 },
)

const TREND_WORD = { up: 'rising', down: 'falling', flat: 'steady' } as const
const top = computed(() => max(props.skills, (s) => s.sharePct) || 1)
const x = computed(() => scaleLinear().domain([0, top.value * 1.1]).range([0, 100]))
const level = computed(() => shadeLevel(top.value))
const aria = computed(
  () =>
    `Share of ${props.roleLabel} jobs naming each skill: ` +
    props.skills.map((s) => `${s.name} ${s.sharePct} percent${s.trend ? ', ' + TREND_WORD[s.trend] : ''}`).join('; ') +
    (props.highlight ? `. Rising fastest: ${props.highlight}.` : ''),
)

</script>

<template>
  <ul :class="['skills', { compact }]" role="img" :aria-label="aria">
    <li
      v-for="(s, i) in skills"
      :key="s.name"
      :class="['row', 'has-tip', { hi: s.name === highlight }]"
      aria-hidden="true"
    >
      <span class="name">{{ s.name }}</span>
      <span class="track">
        <span :class="['fill', 'grow-x', `shade-${level(s.sharePct)}`]" :style="{ width: x(s.sharePct) + '%', '--i': i }" />
      </span>
      <span :class="['val', 'num', s.trend ? 'tr-' + s.trend : '']">
        {{ s.sharePct }}%<Icon v-if="!compact && s.trend" :path="ICON[s.trend]" small />
      </span>
      <span class="tip tip-in">
        <template v-if="s.mentions && ads">Named in {{ s.mentions }} of {{ ads }} published jobs</template>
        <template v-else>In {{ s.sharePct }}% of {{ roleLabel }} jobs</template>
        <template v-if="s.trend"> · {{ TREND_WORD[s.trend] }}</template>{{ s.name === highlight ? ' · rising fastest' : '' }}
      </span>
    </li>
  </ul>
</template>

<style scoped>
.skills { display: flex; flex-direction: column; gap: 4px; }
.row {
  display: grid; grid-template-columns: minmax(110px, 180px) minmax(0, 1fr) 72px; gap: 16px; align-items: center;
  min-height: 48px; padding: 6px var(--space-2); margin: 0 calc(-1 * var(--space-2));
  transition: background-color .15s, opacity .15s;
}
.skills:hover .row { opacity: .5; }
.skills:hover .row:hover { opacity: 1; background: var(--color-bg); }

.name { font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Track + fill: colour = share level (.shade-N in base.css) */
.track { height: 12px; background: var(--color-bg); }
.fill { display: block; height: 100%; min-width: 4px; transition: width .5s var(--ease-out), box-shadow .15s; }
.row:hover .track { background: var(--color-surface); }
.row:hover .fill, .hi .fill { box-shadow: 0 0 0 2px var(--color-surface), 0 0 0 3px var(--color-red-3); }

/* Highlight: fastest riser */
.hi .name { font-weight: 700; color: var(--color-action-strong); }

.val { display: inline-flex; align-items: center; justify-content: flex-end; gap: var(--space-1); font-size: 15px; font-weight: 600; color: var(--color-text-muted); transition: color .15s; }
.row:hover .val:not(.tr-up) { color: var(--color-text); }
.tr-up { color: var(--color-success); }
.tr-down, .tr-flat { color: var(--color-text-muted); }
@media (prefers-reduced-motion: reduce) {
  .fill { transition: none; }
}

/* Compact variant: narrower card */
.compact .row { grid-template-columns: minmax(0, 1fr) minmax(60px, 1fr) 44px; gap: var(--space-2); min-height: 40px; }
@media (max-width: 639px) {
  .row, .compact .row {
    grid-template-columns: minmax(0, 1fr) 64px;
    grid-template-areas: "name val" "track track"; row-gap: 6px;
  }
  .name { grid-area: name; }
  .track { grid-area: track; }
  .val { grid-area: val; }
}
</style>
