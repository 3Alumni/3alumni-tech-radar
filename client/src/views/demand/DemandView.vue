<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import SourceChip from '@/components/ui/SourceChip.vue'
import CantonBars from '@/components/charts/CantonBars.vue'
import CantonMap from '@/components/charts/CantonMap.vue'
import { ICON, fmtNum } from '@/lib/format'
import { cantonMapName, useDemand } from '@/composables/useDemand'
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
const kpi = computed(() => {
  if (!current.value) return 0
  if (region.value === 'all') return current.value.openings
  return shownCantons.value[0]?.count ?? 0
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
          <p v-if="current">{{ current.query }}: {{ fmtNum(current.openings) }} open ads in Adzuna right now.</p>
        </div>
        <div v-if="current" class="kpi">
          <span class="big">{{ fmtNum(kpi) }}</span>
          <span class="muted small kpi-note">
            {{ region === 'all' ? 'open ads in this search' : 'saved ads in ' + region }}
          </span>
        </div>
        <p v-else class="muted"><b>No job ads yet</b> for this role and language.</p>
        <button type="button" class="btn btn-ghost sal-link" :disabled="!salaryTrend" @click="openSalary">
          Average IT salary, last 12 months<Icon :path="ICON.arrow" small />
        </button>
        <SourceChip v-if="current" :names="['Adzuna']" :href="current.sourceUrl" :date="current.fetchedAt" />
      </article>

      <article class="card" aria-labelledby="canton-q">
        <div class="card-head">
          <h2 id="canton-q" class="q">Where are the jobs?</h2>
          <p v-if="current">
            Based on {{ current.sampleSize }} saved ads, not all {{ current.openings }}.
            <template v-if="current.unknownCanton"> {{ current.unknownCanton }} have no canton.</template>
          </p>
        </div>
        <template v-if="cantons.length">
          <CantonMap :cantons="shownCantons" :selected="region" @pick="toggleRegion" />
          <CantonBars :cantons="shownCantons" :selected="region" @pick="toggleRegion" />
        </template>
        <p v-else class="muted"><b>No canton</b> on the saved ads for this search.</p>
        <SourceChip v-if="current" :names="['Adzuna']" :href="current.sourceUrl" :date="current.fetchedAt" />
      </article>
    </div>
  </section>
</template>

<style scoped>
.filters { display: flex; align-items: flex-end; gap: var(--space-3); flex-wrap: wrap; }
.sal-link { align-self: flex-start; margin-left: -12px; }
</style>
