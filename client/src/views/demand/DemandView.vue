<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import CantonBars from '@/components/charts/CantonBars.vue'
import CantonMap from '@/components/charts/CantonMap.vue'
import TrendLine from '@/components/charts/TrendLine.vue'
import { ICON, fmtDate, fmtNum, fmtPct } from '@/lib/format'
import { cantonMapName, useDemand } from '@/composables/useDemand'
import { DEMAND_WEEK_AGO, sampleDays, weekAgoOpenings } from '@/data/demandWeekAgo.sample'
import { useSalaryDialog } from '@/composables/useSalaryDialog'

const ROLES = [
  { id: 'web-developer', label: 'Web developer' },
  { id: 'it-support', label: 'IT support' },
  { id: 'data-analyst', label: 'Data analyst' },
]

const role = ref(ROLES[0]!.id)
const lang = ref<'en' | 'de'>('en')
const region = ref('all')
const { status, errorMessage, queries, salaryTrend } = useDemand()
const salary = useSalaryDialog()

const current = computed(() => queries.value.find((row) => row.role === role.value && row.lang === lang.value) ?? null)
const roleLabel = computed(() => ROLES.find((item) => item.id === role.value)?.label ?? '')
const cantons = computed(() =>
  (current.value?.cantons ?? []).map((row) => ({ canton: cantonMapName(row.canton), count: row.postings })),
)
const shownCantons = computed(() =>
  region.value === 'all' ? cantons.value : cantons.value.filter((row) => row.canton === region.value),
)
watch(cantons, (rows) => {
  if (region.value !== 'all' && !rows.some((row) => row.canton === region.value)) region.value = 'all'
})
const kpi = computed(() => {
  if (!current.value) return 0
  if (region.value === 'all') return current.value.openings
  return shownCantons.value[0]?.count ?? 0
})
const priorOpenings = computed(() => (region.value === 'all' ? weekAgoOpenings(role.value, lang.value) : null))
const weekDeltaPct = computed(() => {
  const prior = priorOpenings.value
  if (!current.value || prior == null || prior === 0) return null
  return Math.round((current.value.openings / prior - 1) * 100)
})
const trendPoints = computed(() => {
  if (!current.value || region.value !== 'all') return []
  const today = current.value.fetchedAt.slice(0, 10)
  const past = sampleDays(role.value, lang.value).filter((day) => day.date < today)
  if (!past.length) return []
  const days = [...past.map((day) => ({ ...day, live: false })), { date: today, openings: current.value.openings, live: true }]
  return days.map((day) => ({
    key: day.date,
    label: fmtDate(day.date),
    short: fmtDate(day.date).replace(/ \d{4}$/, ''),
    value: day.openings,
  }))
})
const trendSummary = computed(() => {
  const points = trendPoints.value
  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last || !current.value) return ''
  return `${current.value.query}, one point per day: ${fmtNum(first.value)} ads on ${first.label}, ${fmtNum(last.value)} ads on ${last.label}`
})

function toggleRegion(canton: string) {
  region.value = region.value === canton ? 'all' : canton
}

function openSalary() {
  const trend = salaryTrend.value
  if (!trend) return
  salary.openChart({
    title: 'IT Jobs',
    note: 'Average advertised salary for all IT job ads in Switzerland, not only this role. Source: Adzuna.',
    points: trend.months.map((month) => ({ month: month.month, chf: month.salary })),
  })
}
</script>

<template>
  <section class="view" aria-labelledby="demand-h">
    <div class="card-head">
      <h1 id="demand-h" class="h1">Demand</h1>
      <p class="muted">Is there work for this role, and where?</p>
    </div>

    <div class="filters">
      <div class="field seg-field">
        <span id="role-l" class="label">Role</span>
        <div class="seg" role="group" aria-labelledby="role-l">
          <button v-for="item in ROLES" :key="item.id" type="button" :aria-pressed="item.id === role" @click="role = item.id; region = 'all'">
            {{ item.label }}
          </button>
        </div>
      </div>
      <div class="field seg-field">
        <span id="lang-l" class="label">Language of the ad</span>
        <div class="seg" role="group" aria-labelledby="lang-l">
          <button type="button" :aria-pressed="lang === 'en'" @click="lang = 'en'">English</button>
          <button type="button" :aria-pressed="lang === 'de'" @click="lang = 'de'">German</button>
        </div>
      </div>
    </div>

    <p v-if="status === 'loading'" class="muted">Loading Adzuna…</p>
    <p v-else-if="status === 'error'" class="muted">Could not load demand. {{ errorMessage }}</p>

    <div v-else class="cards">
      <article class="card" aria-labelledby="kpi-q">
        <div class="card-head">
          <h2 id="kpi-q" class="q">Is there work for {{ roleLabel }}?</h2>
        </div>
        <div v-if="current" class="kpi">
          <span class="big">{{ fmtNum(kpi) }}</span>
          <span class="muted small kpi-note">
            {{ region === 'all' ? 'open ads in this search' : 'published jobs in ' + region }}
          </span>
        </div>
        <p v-if="current && weekDeltaPct != null && priorOpenings != null" class="week">
          <span :class="weekDeltaPct >= 0 ? 'up' : 'down'">
            <Icon :path="weekDeltaPct >= 0 ? ICON.up : ICON.down" small />
            {{ fmtPct(weekDeltaPct, true) }} vs {{ fmtDate(DEMAND_WEEK_AGO.asOf) }}
          </span>
        </p>
        <p v-if="!current" class="muted"><b>No job ads yet</b> for this role and language.</p>
        <button type="button" class="btn btn-ghost sal-link" :disabled="!salaryTrend" @click="openSalary">
          Average IT salary, last 12 months<Icon :path="ICON.arrow" small />
        </button>
        <TrendLine v-if="trendPoints.length" :points="trendPoints" :summary="trendSummary" step="day" />
      </article>

      <article class="card" aria-labelledby="canton-q">
        <div class="card-head">
          <h2 id="canton-q" class="q">Where are the jobs?</h2>
          <p v-if="current">
            Based on {{ current.sampleSize }} published jobs, not all {{ current.openings }}.
            <template v-if="current.unknownCanton"> {{ current.unknownCanton }} have no canton.</template>
          </p>
        </div>
        <template v-if="cantons.length">
          <CantonMap :cantons="shownCantons" :selected="region" />
          <CantonBars :cantons="shownCantons" :selected="region" @pick="toggleRegion" />
        </template>
        <p v-else class="muted"><b>No canton</b> in the published jobs for this search.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.filters { display: flex; align-items: flex-end; gap: var(--space-3) var(--space-6); flex-wrap: wrap; }
.sal-link { align-self: flex-start; margin-left: -12px; }
.week { display: flex; align-items: center; flex-wrap: wrap; gap: var(--space-2); margin: 0; }
</style>
