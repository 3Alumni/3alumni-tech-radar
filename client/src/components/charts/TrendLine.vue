<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { area, curveMonotoneX, easeCubicOut, extent, line, scaleLinear, scalePoint, select } from 'd3'
import { fmtNum } from '@/lib/format'
import { useElementWidth, useReducedMotion } from '@/composables/useMotion'
import { useActiveIndex } from '@/composables/useActiveIndex'

/**
 * Monthly trend as a smooth line over a flat area, with a ring on the latest month and a callout.
 * D3 computes scales and the line/area paths and morphs them on role switch; Vue renders the SVG,
 * markers, callout and the hover/keyboard layer.
 */
interface Point { key: string; label: string; short: string; value: number }
const props = defineProps<{ points: Point[]; summary: string; unit?: string }>()

const HEIGHT = 160
const TOP = 48 // room for the callout above the highest point
const BOTTOM = HEIGHT - 8
const box = ref<HTMLElement | null>(null)
const lineEl = ref<SVGPathElement | null>(null)
const areaEl = ref<SVGPathElement | null>(null)
const width = useElementWidth(box)
const reduced = useReducedMotion()
const count = computed(() => props.points.length)
const { active, onKey, onFocus, onBlur, hover } = useActiveIndex(count)
const unitText = computed(() => props.unit ?? 'job ads')

const x = computed(() =>
  scalePoint<string>().domain(props.points.map((p) => p.key)).range([0, Math.max(width.value, 1)]).padding(0.5),
)
const y = computed(() => {
  const [mn = 0, mx = 1] = extent(props.points, (p) => p.value)
  const pad = (mx - mn || 1) * 0.15
  return scaleLinear().domain([mn - pad, mx]).range([BOTTOM - 12, TOP])
})
const px = (p: Point) => x.value(p.key) ?? 0
const py = (p: Point) => y.value(p.value)
const dLine = computed(() => line<Point>().x(px).y(py).curve(curveMonotoneX)(props.points) ?? '')
const dArea = computed(() => area<Point>().x(px).y0(BOTTOM).y1(py).curve(curveMonotoneX)(props.points) ?? '')
const grid = [TOP, (TOP + BOTTOM) / 2, BOTTOM]

const lastIdx = computed(() => props.points.length - 1)
const focusIdx = computed(() => active.value ?? lastIdx.value)
const focusPt = computed(() => {
  const p = props.points[focusIdx.value]
  return p ? { ...p, x: px(p), y: py(p) } : null
})
const lastPt = computed(() => {
  const p = props.points[lastIdx.value]
  return p ? { x: px(p), y: py(p) } : null
})
const calloutSide = computed(() => {
  const fx = focusPt.value?.x ?? 0
  return fx > width.value - 70 ? 'end' : fx < 70 ? 'start' : 'mid'
})

let first = true
function draw() {
  if (!lineEl.value || !areaEl.value || !width.value) return
  const l = select(lineEl.value)
  const a = select(areaEl.value)
  l.interrupt()
  a.interrupt()
  const still = reduced.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (first && !still) {
    // First view: the line draws on left to right, the area fades in behind it.
    l.attr('d', dLine.value)
    a.attr('d', dArea.value).attr('opacity', 0)
    const len = lineEl.value.getTotalLength()
    l.attr('stroke-dasharray', `${len} ${len}`)
      .attr('stroke-dashoffset', len)
      // Named transition: the unnamed 'd' morph below must not cancel the draw-on.
      .transition('draw').duration(900).ease(easeCubicOut)
      .attr('stroke-dashoffset', 0)
      .on('end interrupt', () => l.attr('stroke-dasharray', null).attr('stroke-dashoffset', null))
    a.transition('draw').delay(300).duration(700).attr('opacity', 1)
  } else if (first || still) {
    l.interrupt('draw').attr('stroke-dasharray', null).attr('stroke-dashoffset', null).attr('d', dLine.value)
    a.interrupt('draw').attr('opacity', 1).attr('d', dArea.value)
  } else {
    l.transition().duration(500).ease(easeCubicOut).attr('d', dLine.value)
    a.transition().duration(500).ease(easeCubicOut).attr('d', dArea.value)
  }
  first = false
}
onMounted(draw)
watch([dLine, dArea], draw)
onBeforeUnmount(() => {
  if (lineEl.value) select(lineEl.value).interrupt().interrupt('draw')
  if (areaEl.value) select(areaEl.value).interrupt().interrupt('draw')
})
</script>

<template>
  <div class="trend-wrap">
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
      <svg :viewBox="`0 0 ${Math.max(width, 1)} ${HEIGHT}`" :width="width" :height="HEIGHT" aria-hidden="true">
        <line v-for="g in grid" :key="g" class="grid" x1="0" :x2="width" :y1="g + 0.5" :y2="g + 0.5" />
        <path ref="areaEl" class="area" />
        <line
          v-if="focusPt && active !== null"
          class="cross"
          :x1="focusPt.x" :x2="focusPt.x" :y1="TOP - 8" :y2="BOTTOM"
        />
        <path ref="lineEl" class="line" />
        <g v-if="lastPt" class="ring" :style="{ transform: `translate(${lastPt.x}px, ${lastPt.y}px)` }">
          <circle r="7" class="ring-halo" />
          <circle r="6" class="ring-dot" />
        </g>
        <g
          v-if="focusPt && active !== null && active !== lastIdx"
          class="marker"
          :style="{ transform: `translate(${focusPt.x}px, ${focusPt.y}px)` }"
        >
          <circle r="5" />
        </g>
      </svg>

      <div
        v-if="focusPt"
        :class="['callout', 'c-' + calloutSide, { live: active !== null }]"
        :style="{ left: focusPt.x + 'px', top: focusPt.y + 'px' }"
        aria-hidden="true"
      >
        <template v-if="active === null">{{ focusPt.label }}</template>
        <template v-else><b>{{ fmtNum(focusPt.value) }}</b> {{ unitText }} · {{ focusPt.label }}</template>
      </div>

      <div class="trend-hit" :style="{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }" aria-hidden="true">
        <div v-for="(p, i) in points" :key="p.key" class="pt" @mouseenter="hover(i)" />
      </div>
    </div>
    <div class="months" :style="{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }" aria-hidden="true">
      <span v-for="(p, i) in points" :key="p.key" :class="{ on: focusIdx === i }">{{ p.short }}</span>
    </div>
    <p class="sr" aria-live="polite">
      <template v-if="active !== null && points[active]">{{ points[active].label }}: {{ fmtNum(points[active].value) }} {{ unitText }}</template>
    </p>
  </div>
</template>

<style scoped>
.trend { position: relative; height: 160px; }
.trend svg { position: absolute; inset: 0; display: block; overflow: visible; }
.grid { stroke: var(--color-border); stroke-width: 1; opacity: .7; }
.area { fill: var(--color-action-subtle); }
.line { fill: none; stroke: var(--color-action); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.cross { stroke: var(--color-text); stroke-width: 1; }

/* Latest month: white ring on the red line, with a quiet halo once the line has drawn. */
.ring, .marker { transition: transform .5s var(--ease-out); }
.ring-dot { fill: var(--color-surface); stroke: var(--color-action); stroke-width: 3; }
.ring-halo { fill: none; stroke: var(--color-action); stroke-width: 2; transform-box: fill-box; transform-origin: center; animation: halo 1.6s var(--ease-out) 1s 2 both; }
.marker circle { fill: var(--color-surface); stroke: var(--color-action); stroke-width: 2.5; }

/* Callout above the focused point: the month by default, value + month while exploring. */
.callout {
  position: absolute; z-index: 2; transform: translate(-50%, calc(-100% - 16px));
  background: var(--color-surface); color: var(--color-text); border: var(--border) solid var(--color-border);
  box-shadow: 0 2px 0 var(--color-border); font-size: 14px; line-height: 20px; font-weight: 600;
  padding: 6px 12px; white-space: nowrap; pointer-events: none;
  transition: left .5s var(--ease-out), top .5s var(--ease-out);
}
.callout b { font-weight: 700; font-variant-numeric: tabular-nums; }
.callout::after {
  content: ""; position: absolute; top: 100%; left: 50%; width: 10px; height: 10px; margin: -5px 0 0 -5px;
  background: var(--color-surface); border-right: var(--border) solid var(--color-border); border-bottom: var(--border) solid var(--color-border);
  transform: rotate(45deg);
}
.callout.live { background: var(--color-text); color: var(--color-surface); border-color: var(--color-text); box-shadow: none; transition: none; }
.callout.live::after { background: var(--color-text); border-color: var(--color-text); }
.callout.c-end { transform: translate(calc(-100% + 18px), calc(-100% - 16px)); }
.callout.c-end::after { left: auto; right: 13px; margin-left: 0; }
.callout.c-start { transform: translate(-18px, calc(-100% - 16px)); }
.callout.c-start::after { left: 18px; }

.trend-hit { position: absolute; inset: 0; display: grid; }
.pt { cursor: crosshair; }
.months {
  display: grid; text-align: center; font-size: 14px; line-height: 20px; color: var(--color-text-muted);
  margin-top: var(--space-2); text-transform: uppercase; letter-spacing: .04em;
}
.months .on { color: var(--color-text); font-weight: 700; }
</style>
