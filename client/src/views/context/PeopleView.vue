<script setup lang="ts">
import { computed, ref } from 'vue'
import RadarLoader from '@/components/ui/RadarLoader.vue'
import CantonMap from '@/components/charts/CantonMap.vue'
import { fmtDate, fmtMonth, fmtNum, isExternalUrl } from '@/lib/format'
import { cantonId } from '@/lib/cantons'
import { usePeopleApi } from '@/composables/usePeopleApi'

const SERIES = [
  { id: 'f', label: 'Status F', prefix: 'Residence status F', total: 'Residence status F', work: 'Status F in work', change: 'Status F in work, change since previous month' },
  { id: 's', label: 'Status S', prefix: 'Residence status S', total: 'Residence status S', work: 'Status S in work', change: '' },
  { id: 'foreign', label: 'Foreign residents', prefix: 'Foreign residents', total: 'Foreign residents', work: '', change: '' },
] as const

const MAP_NAME: Record<string, string> = {
  'Basel-Land': 'Basel-Landschaft',
  Freiburg: 'Fribourg',
  Genf: 'Geneva',
  Luzern: 'Lucerne',
  Neuenburg: 'Neuchâtel',
  Tessin: 'Ticino',
  Waadt: 'Vaud',
  Wallis: 'Valais',
  'Appenzell A. Rh.': 'Appenzell Ausserrhoden',
  'Appenzell I. Rh.': 'Appenzell Innerrhoden',
}

const seriesId = ref<(typeof SERIES)[number]['id']>('f')
const { rows, loading, error } = usePeopleApi()

const series = computed(() => SERIES.find((item) => item.id === seriesId.value) ?? SERIES[0])

function metric(label: string) {
  return rows.value.find((row) => row.label === label)
}

function numberOf(label: string) {
  const row = metric(label)
  if (!row) return null
  const value = typeof row.value === 'number' ? row.value : Number(row.value)
  return Number.isFinite(value) ? value : null
}

const total = computed(() => numberOf(series.value.total))
const inWork = computed(() => (series.value.work ? numberOf(series.value.work) : null))
const change = computed(() => (series.value.change ? numberOf(series.value.change) : null))
const period = computed(() => metric(series.value.total)?.period)

const places = computed(() => {
  const prefix = `${series.value.prefix}, `
  const mapped: { canton: string; count: number }[] = []
  let unspecified: number | null = null
  for (const row of rows.value) {
    if (!row.label.startsWith(prefix) || !row.geo || row.geo === 'CH') continue
    const value = typeof row.value === 'number' ? row.value : Number(row.value)
    if (!Number.isFinite(value)) continue
    if (row.geo === 'Ohne Angabe') {
      unspecified = value
      continue
    }
    const canton = MAP_NAME[row.geo] ?? row.geo
    if (!cantonId(canton)) continue
    mapped.push({ canton, count: value })
  }
  return {
    cantons: mapped.sort((a, b) => b.count - a.count || a.canton.localeCompare(b.canton)),
    unspecified,
  }
})
const source = computed(() => metric(series.value.total))

function periodLabel(period?: string) {
  if (!period) return ''
  return /^\d{4}-\d{2}$/.test(period) ? fmtMonth(period) : period
}
</script>

<template>
  <section class="view" aria-labelledby="ppl-h">
    <div class="card-head">
      <h1 id="ppl-h" class="h1">People</h1>
      <p class="muted">Residence status, asylum and foreign residents. Aggregates only.</p>
    </div>

    <div class="filters">
      <div class="field seg-field">
        <span id="ppl-status-l" class="label">Status</span>
        <div class="seg" role="group" aria-labelledby="ppl-status-l">
          <button
            v-for="item in SERIES"
            :key="item.id"
            type="button"
            :aria-pressed="item.id === seriesId"
            @click="seriesId = item.id"
          >{{ item.label }}</button>
        </div>
      </div>
    </div>

    <p v-if="error" class="small" role="alert">{{ error }}</p>
    <RadarLoader v-else-if="loading" label="people" />

    <template v-else>
      <article class="card" aria-labelledby="ppl-map">
        <div class="card-head">
          <h2 id="ppl-map" class="q">Where are people with {{ series.label }}?</h2>
          <p v-if="total != null">
            {{ fmtNum(total) }} in Switzerland<span v-if="period">, {{ periodLabel(period) }}</span>.
            <template v-if="inWork != null"> {{ fmtNum(inWork) }} in work.</template>
            <template v-if="change != null"> Change since the previous month: {{ change > 0 ? '+' : '' }}{{ fmtNum(change) }}.</template>
          </p>
        </div>
        <CantonMap :cantons="places.cantons" selected="all" unit="people" :ratio="0.46" />
        <p v-if="places.unspecified" class="small muted">
          {{ fmtNum(places.unspecified) }} have no canton in the SEM table (Ohne Angabe).
        </p>
        <p v-if="source" class="small muted">
          Source:
          <a v-if="isExternalUrl(source.sourceUrl)" :href="source.sourceUrl" target="_blank" rel="noopener noreferrer">State Secretariat for Migration</a>
          <template v-else>State Secretariat for Migration</template>
          · {{ fmtDate(source.fetchedAt.slice(0, 10)) }}
        </p>
      </article>
    </template>
  </section>
</template>

<style scoped>
.view { gap: var(--space-4); }
.filters { display: flex; align-items: flex-end; gap: var(--space-3); flex-wrap: wrap; }
</style>
