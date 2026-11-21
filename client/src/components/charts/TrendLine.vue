<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { extent, line, scaleLinear, scalePoint, select } from 'd3'
import { fmtNum } from '@/lib/format'
import { useElementWidth, useReducedMotion } from '@/composables/useMotion'
import { useActiveIndex } from '@/composables/useActiveIndex'

/**
 * Monthly trend line. D3 computes scales and the path; Vue renders the SVG and the hover/focus layer.
 * On data change (role switch) D3 transitions the same <path> so the line morphs instead of redrawing.
 */
interface Point { key: string; label: string; short: string; value: number }
const props = defineProps<{ points: Point[]; summary: string; unit?: string }>()

const HEIGHT = 96
const box = ref<HTMLElement | null>(null)
const pathEl = ref<SVGPathElement | null>(null)
const width = useElementWidth(box)
const reduced = useReducedMotion()
const count = computed(() => props.points.length)
const { active, onKey, onFocus, onBlur, hover } = useActiveIndex(count)

const x = computed(() =>
  scalePoint<string>()
    .domain(props.points.map((p) => p.key))
    .range([0, Math.max(width.value, 1)])
    .padding(0.5),
)
const y = computed(() => {
  const [mn = 0, mx = 1] = extent(props.points, (p) => p.value)
  return scaleLinear().domain(mn === mx ? [mn - 1, mx + 1] : [mn, mx]).range([84, 14])
})
const d = computed(() =>
  line<Point>()
    .x((p) => x.value(p.key) ?? 0)
    .y((p) => y.value(p.value))(props.points) ?? '',
)
const dots = computed(() =>
  props.points.map((p, i) => ({
    ...p,
    topPct: (y.value(p.value) / HEIGHT) * 100,
    last: i === props.points.length - 1,
  })),
)

let first = true
function draw() {
  if (!pathEl.value || !width.value) return
  const sel = select(pathEl.value)
  sel.interrupt()
  if (first || reduced.value) {
    sel.attr('d', d.value)
    first = false
  } else {
    sel.transition().duration(500).attr('d', d.value)
  }
}
onMounted(draw)
watch(d, draw)
onBeforeUnmount(() => {
  if (pathEl.value) select(pathEl.value).interrupt()
})

const tipFor = (i: number) => (i === props.points.length - 1 ? 'tip tip-r' : i === 0 ? 'tip tip-l' : 'tip')
</script>

<template>
  <div>
    <div
      ref="box"
      class="trend"
      role="img"
      tabindex="0"
      :aria-label="summary + '. Use arrow keys to read each month.'"
      @keydown="onKey"
      @focus="onFocus"
      @blur="onBlur"
      @mouseleave="hover(null)"
    >
      <svg :viewBox="`0 0 ${Math.max(width, 1)} ${HEIGHT}`" preserveAspectRatio="none" aria-hidden="true">
        <line class="base" x1="0" :x2="width" :y1="HEIGHT - 0.5" :y2="HEIGHT - 0.5" />
        <path ref="pathEl" class="line" />
      </svg>
      <div class="trend-hit" :style="{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }" aria-hidden="true">
        <div
          v-for="(p, i) in dots"
          :key="p.key"
          :class="['pt', { on: active === i }]"
          @mouseenter="hover(i)"
        >
          <span class="pt-line" />
          <span :class="['pt-dot', { last: p.last }]" :style="{ top: p.topPct + '%' }" />
          <span :class="tipFor(i)"><b>{{ fmtNum(p.value) }}</b> {{ unit ?? 'job ads' }} · {{ p.label }}</span>
        </div>
      </div>
    </div>
    <div class="months" :style="{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }" aria-hidden="true">
      <span v-for="p in points" :key="p.key">{{ p.short }}</span>
    </div>
    <p class="sr" aria-live="polite">
      <template v-if="active !== null && points[active]">{{ points[active].label }}: {{ fmtNum(points[active].value) }} {{ unit ?? 'job ads' }}</template>
    </p>
  </div>
</template>

<style scoped>
.trend { position: relative; height: 96px; }
.trend svg { position: absolute; inset: 0; width: 100%; height: 96px; }
.base { stroke: var(--color-border); stroke-width: 1; }
.line { fill: none; stroke: var(--color-action); stroke-width: 2.5; vector-effect: non-scaling-stroke; }
.trend-hit { position: absolute; inset: 0; display: grid; }
.pt { position: relative; cursor: crosshair; }
.pt-line { position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: var(--color-border-strong); opacity: 0; transition: opacity .1s; }
.pt-dot {
  position: absolute; left: 50%; width: 10px; height: 10px; margin: -5px 0 0 -5px;
  background: var(--color-surface); border: 2px solid var(--color-action); opacity: 0;
  transition: opacity .1s, top .5s ease;
}
.pt-dot.last { opacity: 1; background: var(--color-action); }
.pt.on .pt-line, .pt.on .pt-dot { opacity: 1; }
.pt .tip { bottom: auto; top: -44px; }
.pt.on .tip { opacity: 1; visibility: visible; }
.months { display: grid; text-align: center; font-size: 14px; line-height: 20px; color: var(--color-text-muted); margin-top: var(--space-1); }
</style>
