<script setup lang="ts">
import { computed } from 'vue'
import { max, scaleLinear } from 'd3'
import Icon from '@/components/ui/Icon.vue'
import { ICON } from '@/lib/format'
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
 * One series, so bars are grey; the `highlight` skill (fastest riser) is the one red bar.
 * `compact` = Overview widget.
 */
const props = withDefaults(
  defineProps<{ skills: BarSkill[]; roleLabel: string; ads?: number; highlight?: string; compact?: boolean }>(),
  { highlight: '', compact: false, ads: 0 },
)

const TREND_WORD = { up: 'rising', down: 'falling', flat: 'steady' } as const
const x = computed(() => scaleLinear().domain([0, (max(props.skills, (s) => s.sharePct) ?? 1) * 1.1]).range([0, 100]))
const aria = computed(
  () =>
    `Share of ${props.roleLabel} ads naming each skill: ` +
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
        <span class="fill grow-x" :style="{ width: x(s.sharePct) + '%', '--i': i }" />
      </span>
      <span :class="['val', 'num', s.trend ? 'tr-' + s.trend : '']">
        {{ s.sharePct }}%<Icon v-if="!compact && s.trend" :path="ICON[s.trend]" small />
      </span>
      <span class="tip tip-in">
        <template v-if="s.mentions && ads">Named in {{ s.mentions }} of {{ ads }} saved ads</template>
        <template v-else>In {{ s.sharePct }}% of {{ roleLabel }} ads</template>
        <template v-if="s.trend"> · {{ TREND_WORD[s.trend] }}</template>{{ s.name === highlight ? ' · rising fastest' : '' }}
      </span>
    </li>
  </ul>
</template>

<style scoped>
.skills { display: flex; flex-direction: column; gap: var(--space-1); }
.row {
  display: grid; grid-template-columns: minmax(110px, 180px) minmax(0, 1fr) 72px; gap: 12px; align-items: center;
  min-height: 48px; padding: 6px var(--space-2); margin: 0 calc(-1 * var(--space-2));
  transition: background-color .15s, opacity .15s;
}
.skills:hover .row { opacity: .5; }
.skills:hover .row:hover { opacity: 1; background: var(--color-bg); }

.name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.track { height: 10px; background: var(--color-bg); box-shadow: inset 0 0 0 1px var(--color-border); }
.fill { display: block; height: 10px; background: var(--color-text-muted); transition: width .5s var(--ease-out), background-color .15s; }
.hi .fill { background: var(--color-action); }
.row:hover .fill { background: var(--color-text); }
.row.hi:hover .fill { background: var(--color-action-strong); }

.val { display: inline-flex; align-items: center; justify-content: flex-end; gap: var(--space-1); font-size: 14px; font-weight: 700; }
.tr-up { color: var(--color-success); }
.tr-down, .tr-flat { color: var(--color-text-muted); }

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
