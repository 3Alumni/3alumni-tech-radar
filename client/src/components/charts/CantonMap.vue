<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import { geoMercator, geoPath, max, scaleQuantize, type GeoPermissibleObjects } from 'd3'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { GeometryCollection, Topology } from 'topojson-specification'
import { fmtNum } from '@/lib/format'
import { CANTONS, cantonId } from '@/lib/cantons'
import { useElementWidth } from '@/composables/useMotion'
import type { CantonCount } from '@/lib/types'

/**
 * Choropleth of job ads per canton. swiss-maps TopoJSON (WGS84) → topojson-client feature()
 * → d3 geoMercator().fitSize() + geoPath(). Vue renders every <path>; D3 only does the maths.
 * Hover-only: tooltip + highlight; filtering happens in the bars and the Region select.
 * Map: BFS, GEOSTAT (non-commercial licence).
 */
const props = defineProps<{ cantons: CantonCount[]; selected: string }>()

type Geo = Feature<Geometry, { id?: number }>
const shapes = shallowRef<{ cantons: Geo[]; lakes: Geo[]; outline: FeatureCollection } | null>(null)
const failed = ref(false)

// Loaded once per page, only when the map is first shown (keeps it out of the main bundle).
let cache: Promise<typeof shapes.value> | null = null
function loadShapes() {
  cache ??= import('swiss-maps/2026/ch-combined.json').then((m) => {
    const topo = (m.default ?? m) as unknown as Topology<{
      cantons: GeometryCollection; lakes: GeometryCollection; country: GeometryCollection
    }>
    const fc = (o: GeometryCollection) => feature(topo, o) as unknown as FeatureCollection<Geometry, { id?: number }>
    const cantons = fc(topo.objects.cantons).features.map((f) => ({ ...f, properties: { id: Number(f.id) } }))
    return { cantons, lakes: fc(topo.objects.lakes).features, outline: fc(topo.objects.country) }
  })
  return cache
}
onMounted(async () => {
  try {
    shapes.value = await loadShapes()
  } catch {
    failed.value = true
  }
})

const box = ref<HTMLElement | null>(null)
const width = useElementWidth(box)
const height = computed(() => Math.round(Math.max(width.value, 1) * 0.64))

const path = computed(() => {
  if (!shapes.value || !width.value) return null
  const projection = geoMercator().fitSize([width.value, height.value], shapes.value.outline as GeoPermissibleObjects)
  return geoPath(projection)
})

// Snapshot counts keyed by BFS number.
const byId = computed(() => {
  const m = new Map<number, CantonCount>()
  for (const c of props.cantons) {
    const id = cantonId(c.canton)
    if (id) m.set(id, c)
  }
  return m
})
const unmatched = computed(() => props.cantons.filter((c) => !cantonId(c.canton)).map((c) => c.canton))

// Sequential greys in 4 equal steps from 0 to the top canton (classes map to CSS tokens).
const top = computed(() => max(props.cantons, (c) => c.count) || 1)
// Small counts (≤ 4): one step per count, legend shows plain numbers. Larger: 4 equal ranges.
const small = computed(() => top.value <= 4)
const scale = computed(() => {
  if (small.value) {
    const offset = 4 - top.value // darkest step = top count
    return (v: number) => Math.min(4, Math.max(1, Math.round(v) + offset))
  }
  const q = scaleQuantize<number>().domain([0, top.value]).range([1, 2, 3, 4])
  return (v: number) => q(v)
})
const legend = computed(() => {
  if (small.value)
    return Array.from({ length: top.value }, (_, i) => i + 1).map((n) => ({ lvl: scale.value(n), label: fmtNum(n) }))
  const q = scaleQuantize<number>().domain([0, top.value]).range([1, 2, 3, 4])
  return q.range().map((lvl) => {
    const [a = 0, b = 0] = q.invertExtent(lvl)
    return { lvl, label: `${fmtNum(Math.round(a))}–${fmtNum(Math.round(b))}` }
  })
})

const cantonPaths = computed(() => {
  const p = path.value
  if (!p || !shapes.value) return []
  return shapes.value.cantons.map((f) => {
    const id = f.properties.id ?? 0
    const data = byId.value.get(id)
    const name = data?.canton ?? CANTONS[id] ?? ''
    const [cx = 0, cy = 0] = p.centroid(f)
    return {
      id, name, data, d: p(f) ?? '', cx, cy,
      lvl: data ? scale.value(data.count) : 0,
    }
  })
})
const lakePaths = computed(() => (path.value && shapes.value ? shapes.value.lakes.map((f, i) => ({ k: i, d: path.value!(f) ?? '' })) : []))

// Direct label (name + number): the canton picked in the Region filter, else the top one.
const labelled = computed(() => {
  const list = cantonPaths.value.filter((c) => c.data)
  return list.find((c) => c.data!.canton === props.selected) ?? [...list].sort((a, b) => b.data!.count - a.data!.count)[0] ?? null
})
// Text alternative: the map is hover-only, so screen readers get every count here.
const summary = computed(() => {
  const list = [...props.cantons].sort((a, b) => b.count - a.count)
  return 'Map of Switzerland, job ads by canton: ' + list.map((c) => `${c.canton} ${fmtNum(c.count)}`).join(', ')
})

const hoverId = ref<number | null>(null)
const tip = computed(() => cantonPaths.value.find((c) => c.id === hoverId.value) ?? null)
// Keep tooltip and label inside the card: anchor them away from the nearest edge.
const side = (x: number) => (x < width.value * 0.28 ? 'start' : x > width.value * 0.72 ? 'end' : 'mid')
const numberLabels = computed(() =>
  cantonPaths.value.filter((c) => c.data && c.id !== labelled.value?.id && c.id !== hoverId.value),
)
const showLabel = computed(() => labelled.value && labelled.value.id !== hoverId.value)
const labelEnd = computed(() => !!labelled.value && labelled.value.cx > width.value * 0.7)

</script>

<template>
  <figure class="map-fig">
    <div ref="box" class="map" :style="{ height: height + 'px' }" @mouseleave="hoverId = null">
      <p v-if="failed" class="small muted">The map could not load. The list below shows the same numbers.</p>
      <div v-else-if="!path" class="map-skel" aria-hidden="true" />
      <svg
        v-else
        :viewBox="`0 0 ${width} ${height}`"
        :width="width"
        :height="height"
        role="img"
        :aria-label="summary"
      >
        <g class="cantons">
          <path
            v-for="c in cantonPaths"
            :key="c.id"
            :d="c.d"
            :class="['canton', c.data ? 'lvl-' + c.lvl : 'no-data', { hot: hoverId === c.id }]"
            aria-hidden="true"
            @mouseenter="hoverId = c.id"
          />
        </g>
        <g class="lakes" aria-hidden="true">
          <path v-for="l in lakePaths" :key="l.k" :d="l.d" class="lake" />
        </g>
        <g class="nums" aria-hidden="true">
          <text
            v-for="c in numberLabels"
            :key="c.id"
            :x="c.cx"
            :y="c.cy + 5"
            text-anchor="middle"
            class="num-label"
          >{{ fmtNum(c.data!.count) }}</text>
        </g>
        <g v-if="labelled && showLabel" class="label" aria-hidden="true" :transform="`translate(${labelled.cx},${labelled.cy})`">
          <circle r="4" class="label-dot" />
          <text :x="labelEnd ? -10 : 10" y="-6" :text-anchor="labelEnd ? 'end' : 'start'" class="label-name">{{ labelled.name }}</text>
          <text :x="labelEnd ? -10 : 10" y="12" :text-anchor="labelEnd ? 'end' : 'start'" class="label-val">{{ fmtNum(labelled.data!.count) }}</text>
        </g>
      </svg>
      <div
        v-if="tip"
        :class="['map-tip', 'tip-' + side(tip.cx)]"
        aria-hidden="true"
        :style="{ left: tip.cx + 'px', top: tip.cy + 'px' }"
      >
        <template v-if="tip.data"><b>{{ tip.name }}</b> · {{ fmtNum(tip.data.count) }} job ads</template>
        <template v-else><b>{{ tip.name }}</b> · no data yet</template>
      </div>
    </div>

    <figcaption class="map-foot">
      <ul class="legend" aria-label="Job ads per canton">
        <li v-for="l in legend" :key="l.lvl"><span :class="['sw', 'lvl-' + l.lvl]" aria-hidden="true" />{{ l.label }}</li>
        <li><span class="sw no-data" aria-hidden="true" />No data</li>
      </ul>
      <span class="small muted">Map: BFS, GEOSTAT</span>
    </figcaption>
    <p v-if="unmatched.length" class="small muted">Not on the map (name not recognised): {{ unmatched.join(', ') }}</p>
  </figure>
</template>

<style scoped>
.map-fig { margin: 0; display: flex; flex-direction: column; gap: 12px; }
.map { position: relative; width: 100%; }
.map svg { display: block; overflow: visible; }
.map-skel { width: 100%; height: 100%; background: var(--color-bg); }

.canton {
  stroke: var(--color-surface); stroke-width: 1; stroke-linejoin: round;
  transition: fill .4s var(--ease-out), opacity .15s;
}
.no-data { fill: var(--color-bg); stroke: var(--color-border); }
.lvl-1 { fill: var(--color-red-1); }
.lvl-2 { fill: var(--color-red-2); }
.lvl-3 { fill: var(--color-red-3); }
.lvl-4 { fill: var(--color-red-4); }
/* Hover/focus: dim the rest, ink outline on the one under the pointer (drawn above its neighbours). */
.cantons:hover .canton:not(.hot):not(.no-data) { opacity: .55; }
.canton.hot { stroke: var(--color-text); stroke-width: 2.5; paint-order: stroke; }
.canton:focus { outline: none; }
.canton:focus-visible { stroke: var(--color-text); stroke-width: 3; }
.lake { fill: var(--color-surface); stroke: var(--color-border); stroke-width: .5; pointer-events: none; }

.label, .nums { pointer-events: none; }
.num-label {
  font-size: 14px; font-weight: 700; fill: var(--color-text); font-variant-numeric: tabular-nums;
  paint-order: stroke; stroke: var(--color-surface); stroke-width: 3px; stroke-linejoin: round;
}
.label-dot { fill: var(--color-surface); stroke: var(--color-text); stroke-width: 2; }
.label-name, .label-val {
  font-size: 14px; fill: var(--color-text);
  paint-order: stroke; stroke: var(--color-surface); stroke-width: 4px; stroke-linejoin: round;
}
.label-name { font-weight: 700; }
.label-val { font-variant-numeric: tabular-nums; }

.map-tip {
  position: absolute; z-index: 8; transform: translate(-50%, calc(-100% - 14px));
  background: var(--color-text); color: var(--color-surface); font-size: 14px; line-height: 20px;
  padding: 6px 10px; white-space: nowrap; pointer-events: none;
  animation: tick-in .16s var(--ease-out);
}
.map-tip::after {
  content: ""; position: absolute; top: 100%; left: 50%; margin-left: -5px;
  border: 5px solid transparent; border-top-color: var(--color-text);
}
.map-tip.tip-start { transform: translate(-16px, calc(-100% - 14px)); }
.map-tip.tip-start::after { left: 16px; }
.map-tip.tip-end { transform: translate(calc(-100% + 16px), calc(-100% - 14px)); }
.map-tip.tip-end::after { left: auto; right: 11px; }
.map-foot { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-2) var(--space-3); }
.legend { display: flex; flex-wrap: wrap; gap: var(--space-1) 12px; font-size: 14px; line-height: 20px; color: var(--color-text-muted); }
.legend li { display: inline-flex; align-items: center; gap: 6px; font-variant-numeric: tabular-nums; }
.sw { width: 14px; height: 14px; flex: none; }
.sw.lvl-1 { background: var(--color-red-1); }
.sw.lvl-2 { background: var(--color-red-2); }
.sw.lvl-3 { background: var(--color-red-3); }
.sw.lvl-4 { background: var(--color-red-4); }
.sw.no-data { background: var(--color-bg); box-shadow: inset 0 0 0 1px var(--color-border); }
</style>
