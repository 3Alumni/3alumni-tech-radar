<script setup lang="ts">
import { computed } from 'vue'
import { max, scaleLinear } from 'd3'
import Icon from '@/components/ui/Icon.vue'
import { ICON } from '@/lib/format'
import type { Skill } from '@/lib/types'

/** Share of job ads naming each skill, with a rising/falling marker. `compact` = Overview widget. */
const props = withDefaults(defineProps<{ skills: Skill[]; roleLabel: string; compact?: boolean }>(), { compact: false })

const TREND_WORD = { up: 'rising', down: 'falling', flat: 'steady' } as const
const x = computed(() => scaleLinear().domain([0, Math.max(55, max(props.skills, (s) => s.sharePct) ?? 0)]).range([0, 100]))
const aria = computed(
  () =>
    `Share of ${props.roleLabel} ads naming each skill: ` +
    props.skills.map((s) => `${s.name} ${s.sharePct} percent, ${TREND_WORD[s.trend]}`).join('; '),
)
</script>

<template>
  <div :class="['bars', { compact }]" role="img" :aria-label="aria">
    <div v-for="s in skills" :key="s.name" class="bar-row has-tip" aria-hidden="true">
      <span class="bar-name">{{ s.name }}</span>
      <div class="bar-track">
        <div class="bar-fill" :style="{ width: x(s.sharePct) + '%' }">
          <span class="tip tip-in">In {{ s.sharePct }}% of {{ roleLabel }} ads · {{ TREND_WORD[s.trend] }}</span>
        </div>
      </div>
      <span :class="['bar-val', 'num', 'tr-' + s.trend]">
        <Icon v-if="!compact" :path="ICON[s.trend]" small />{{ s.sharePct }}%
      </span>
    </div>
  </div>
</template>

<style scoped>
.bars { display: flex; flex-direction: column; gap: 2px; }
.bar-row {
  display: grid; grid-template-columns: 180px minmax(0, 1fr) 92px; gap: 12px; align-items: center;
  min-height: 36px; font-size: 15px; transition: opacity .15s;
}
.compact .bar-row { grid-template-columns: 120px minmax(0, 1fr) 48px; }
.bars:hover .bar-row { opacity: .45; }
.bars:hover .bar-row:hover { opacity: 1; }
.bar-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { height: 12px; background: var(--color-bg); }
.bar-fill { position: relative; height: 12px; background: var(--color-text-muted); transition: width .5s ease; }
.bar-fill .tip { left: 100%; }
.bar-val { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-1); font-size: 14px; font-weight: 700; }
.tr-up { color: var(--color-success); }
.tr-down, .tr-flat { color: var(--color-text-muted); }
@media (max-width: 639px) {
  .bar-row, .compact .bar-row { grid-template-columns: 100px minmax(0, 1fr) 64px; gap: var(--space-2); font-size: 14px; }
}
</style>
