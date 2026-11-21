<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { descending, interpolateNumber, interval, max, scaleBand, scaleLinear, select, type Timer } from 'd3'
import Icon from '@/components/ui/Icon.vue'
import { ICON, fmtMonth, fmtNum } from '@/lib/format'
import type { Role } from '@/lib/types'
import { useReducedMotion } from '@/composables/useMotion'

/**
 * Bar race: job ads per role, month by month. Plays once per session, Replay restarts it.
 *
 * Vue renders one <button> per role (stable DOM, real buttons for keyboard + click).
 * D3 owns only position, bar width and the value label: a keyed join (by role id) on those
 * buttons, then transitions re-sort the bars and tween the numbers with interpolateNumber.
 */
const props = defineProps<{ roles: Role[]; selectedId: string }>()
const emit = defineEmits<{ open: [roleId: string] }>()

const ROW = 40 // px per bar incl. gap
const STEP_MS = 900
const reduced = useReducedMotion()

const raceEl = ref<HTMLElement | null>(null)
const months = computed(() => props.roles[0]?.adsByMonth.map((m) => m.month) ?? [])
const lastIdx = computed(() => Math.max(0, months.value.length - 1))
const idx = ref(played ? lastIdx.value : 0)
let timer: Timer | null = null

const maxAll = computed(() => max(props.roles.flatMap((r) => r.adsByMonth.map((m) => m.count))) ?? 1)
const at = (i: number) =>
  props.roles.map((r) => ({ id: r.id, label: r.label, v: r.adsByMonth[i]?.count ?? 0 }))
const sortedNow = computed(() => [...at(idx.value)].sort((a, b) => descending(a.v, b.v)))
const monthLabel = computed(() => (months.value[idx.value] ? fmtMonth(months.value[idx.value]!, true) : ''))
const groupAria = computed(
  () => `Job ads per role in ${monthLabel.value}: ` + sortedNow.value.map((r) => `${r.label} ${fmtNum(r.v)}`).join(', '),
)
const rowAria = (id: string) => {
  const r = at(idx.value).find((x) => x.id === id)
  return r ? `${r.label}: ${fmtNum(r.v)} job ads in ${monthLabel.value}. Show average salary` : ''
}

type Row = { id: string; v: number }

function draw(animate: boolean) {
  if (!raceEl.value) return
  const rows: Row[] = at(idx.value)
  const order = [...rows].sort((a, b) => descending(a.v, b.v)).map((r) => r.id)
  const y = scaleBand<string>().domain(order).range([0, order.length * ROW])
  const x = scaleLinear().domain([0, maxAll.value * 1.08]).range([0, 100])
  const duration = animate && !reduced.value ? STEP_MS - 150 : 0

  const sel = select(raceEl.value)
    .selectAll<HTMLButtonElement, Row>('button.race-row')
    .data(rows, function (d) {
      return d ? d.id : (this as HTMLButtonElement).dataset.id ?? ''
    })

  sel.interrupt()
  sel.transition().duration(duration).style('transform', (d) => `translateY(${y(d.id) ?? 0}px)`)
  sel.select<HTMLElement>('.race-fill').interrupt().transition().duration(duration).style('width', (d) => `${x(d.v)}%`)
  sel.select<HTMLElement>('.race-val').interrupt().transition().duration(duration)
    .tween('text', function (d) {
      // Start from whatever is on screen now, so an interrupted step never jumps.
      const from = Number((this.textContent ?? '').replace(/\D/g, '')) || 0
      const i = interpolateNumber(from, d.v)
      return (t) => {
        this.textContent = fmtNum(i(t))
      }
    })
}

function stop() {
  timer?.stop()
  timer = null
}

function play() {
  stop()
  if (reduced.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    idx.value = lastIdx.value
    draw(false)
    return
  }
  idx.value = 0
  draw(false)
  // d3.interval shares the transition clock, so steps and transitions pause and resume together.
  timer = interval(() => {
    idx.value += 1
    draw(true)
    if (idx.value >= lastIdx.value) {
      stop()
      played = true
    }
  }, STEP_MS)
}

onMounted(async () => {
  await nextTick()
  if (played) draw(false)
  else play()
})
watch(
  () => props.roles,
  async () => {
    await nextTick()
    idx.value = Math.min(idx.value, lastIdx.value)
    draw(false)
  },
)
onBeforeUnmount(() => {
  stop()
  if (raceEl.value) select(raceEl.value).selectAll('*').interrupt()
})
</script>

<script lang="ts">
// Module scope: the race plays once per page load, not every time Overview is opened.
let played = false
</script>

<template>
  <div class="race-head">
    <span :key="monthLabel" class="race-month">{{ monthLabel }}</span>
    <span class="small muted hint">Click a role to see its salary</span>
    <button type="button" class="btn btn-ghost" @click="play"><Icon :path="ICON.replay" />Replay</button>
  </div>
  <div
    ref="raceEl"
    class="race"
    role="group"
    :aria-label="groupAria"
    :style="{ height: roles.length * ROW + 'px' }"
  >
    <button
      v-for="r in roles"
      :key="r.id"
      type="button"
      class="race-row race-btn has-tip"
      :data-id="r.id"
      :aria-label="rowAria(r.id)"
      @click="emit('open', r.id)"
    >
      <span class="race-name">{{ r.label }}</span>
      <span class="race-track">
        <span :class="['race-fill', { sel: r.id === selectedId }]">
          <span class="tip tip-in" aria-hidden="true">Click for salary</span>
        </span>
        <span class="race-val num" aria-hidden="true" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.race-head { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }
.race-month { font-size: 24px; line-height: 32px; font-weight: 700; font-variant-numeric: tabular-nums; animation: tick-in .3s var(--ease-out); }
.hint { margin-left: auto; }
.race { position: relative; }
.race-row {
  position: absolute; top: 0; left: 0;
  display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 12px; align-items: center;
  height: 36px; transition: opacity .15s;
}
.race-btn {
  width: calc(100% + 16px); margin: 0 calc(-1 * var(--space-2)); padding: 2px var(--space-2);
  color: var(--color-text); text-align: left; background: transparent; border: 0; cursor: pointer;
}
.race:hover .race-row { opacity: .45; }
.race:hover .race-row:hover { opacity: 1; }
.race-btn:hover { background: var(--color-bg); }
.race-btn:hover .race-name { color: var(--color-action); text-decoration: underline; text-underline-offset: 3px; }
.race-name { font-weight: 600; }
.race-track { display: flex; align-items: center; gap: var(--space-2); height: 32px; min-width: 0; }
.race-fill { position: relative; display: block; height: 24px; width: 0; background: var(--color-text-muted); transition: background-color .15s; }
.race-btn:hover .race-fill:not(.sel), .race-btn:focus-visible .race-fill:not(.sel) { background: var(--color-text); }
.race-fill.sel { background: var(--color-action); }
.race-fill .tip { left: 100%; }
.race-val { font-size: 14px; font-weight: 700; white-space: nowrap; }
@media (max-width: 639px) {
  .race-row { grid-template-columns: 96px minmax(0, 1fr); }
  .hint { display: none; }
}
</style>
