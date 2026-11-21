<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { ICON, fmtDate, fmtNum, fmtPct } from '@/lib/format'
import { cantonMapName, useDemand } from '@/composables/useDemand'
import { useSkills } from '@/composables/useSkills'
import { useEmployers } from '@/composables/useEmployers'
import { usePolicyApi } from '@/composables/usePolicyApi'
import { DEMAND_WEEK_AGO, weekAgoOpenings } from '@/data/demandWeekAgo.sample'
import { useView } from '@/composables/useView'
import { useSalaryDialog } from '@/composables/useSalaryDialog'
import { useCountUp } from '@/composables/useMotion'

const ROLES = [
  { id: 'web-developer', label: 'Web developer' },
  { id: 'it-support', label: 'IT support' },
  { id: 'data-analyst', label: 'Data analyst' },
]

const role = ref(ROLES[0]!.id)
const lang = ref<'en' | 'de'>('en')
const { status, errorMessage, queries, salaryTrend } = useDemand()
const skills = useSkills()
const employers = useEmployers()
const { items: policyItems, loading: policyLoading } = usePolicyApi()
const { go } = useView()
const salary = useSalaryDialog()

const current = computed(() => queries.value.find((row) => row.role === role.value && row.lang === lang.value) ?? null)
const openings = computed(() => current.value?.openings ?? 0)
const kpiShown = useCountUp(openings)
const prior = computed(() => weekAgoOpenings(role.value, lang.value))
const weekDeltaPct = computed(() => {
  const then = prior.value
  if (!current.value || then == null || then === 0) return null
  return Math.round((current.value.openings / then - 1) * 100)
})
const topCanton = computed(() => {
  const row = [...(current.value?.cantons ?? [])].sort((a, b) => b.postings - a.postings)[0]
  return row ? { name: cantonMapName(row.canton), count: row.postings } : null
})
const topSkill = computed(() => skills.byRole.value[role.value]?.esco[0]?.label ?? '')
const ranking = computed(() =>
  ROLES.map((item) => ({
    ...item,
    openings: queries.value.find((row) => row.role === item.id && row.lang === lang.value)?.openings ?? 0,
  })).sort((a, b) => b.openings - a.openings || a.label.localeCompare(b.label)),
)
const rankMax = computed(() => Math.max(...ranking.value.map((row) => row.openings), 1))
const employerTop = computed(() => {
  const payload = employers.data.value
  if (!payload) return []
  return payload.outreach
    .map((group) => ({ name: group.company, jobs: group.roles[role.value] ?? 0 }))
    .filter((row) => row.jobs > 0)
    .sort((a, b) => b.jobs - a.jobs || a.name.localeCompare(b.name))
    .slice(0, 4)
})

const policyTop = computed(() => policyItems.value.slice(0, 3))

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
  <section class="view" aria-labelledby="ov-h">
    <div class="page-head">
      <div class="card-head">
        <h1 id="ov-h" class="h1">Overview</h1>
        <p class="muted">Where the IT jobs are, which skills to teach, and what is changing.</p>
      </div>
    </div>

    <div class="filters">
      <div class="field seg-field">
        <span id="ov-role-l" class="label">Role</span>
        <div class="seg" role="group" aria-labelledby="ov-role-l">
          <button v-for="item in ROLES" :key="item.id" type="button" :aria-pressed="item.id === role" @click="role = item.id">
            {{ item.label }}
          </button>
        </div>
      </div>
      <div class="field seg-field">
        <span id="ov-lang-l" class="label">Language of the ad</span>
        <div class="seg" role="group" aria-labelledby="ov-lang-l">
          <button type="button" :aria-pressed="lang === 'en'" @click="lang = 'en'">English</button>
          <button type="button" :aria-pressed="lang === 'de'" @click="lang = 'de'">German</button>
        </div>
      </div>
    </div>

    <p v-if="status === 'loading'" class="muted">Loading Adzuna…</p>
    <p v-else-if="status === 'error'" class="muted">Could not load overview. {{ errorMessage }}</p>

    <div v-else class="tiles">
      <button type="button" class="tile" @click="go('demand')">
        <span class="small muted">Open job ads</span>
        <span class="tile-v">{{ fmtNum(kpiShown) }}</span>
        <span v-if="weekDeltaPct != null" :class="weekDeltaPct >= 0 ? 'up' : 'down'">
          <Icon :path="weekDeltaPct >= 0 ? ICON.up : ICON.down" small />
          {{ fmtPct(weekDeltaPct, true) }} vs {{ fmtDate(DEMAND_WEEK_AGO.asOf) }}
        </span>
        <span class="tile-more">Demand<Icon :path="ICON.arrow" small /></span>
      </button>
      <button type="button" class="tile" @click="go('demand')">
        <span class="small muted">Most saved ads in</span>
        <span class="tile-v">{{ topCanton?.name ?? '—' }}</span>
        <span class="tile-more">Demand<Icon :path="ICON.arrow" small /></span>
      </button>
      <button type="button" class="tile" @click="go('skills')">
        <span class="small muted">Top ESCO skill</span>
        <span class="tile-v">{{ topSkill || 'None' }}</span>
        <span class="tile-more">Skills<Icon :path="ICON.arrow" small /></span>
      </button>
    </div>

    <div v-if="status === 'ready'" class="grid">
      <article class="card c-6" aria-labelledby="race-q">
        <div class="card-head">
          <h2 id="race-q" class="q">Which role has the most job ads?</h2>
        </div>
        <div class="rank" role="list">
          <button v-for="item in ranking" :key="item.id" type="button" class="rank-row" @click="role = item.id; openSalary()">
            <span class="rank-name">{{ item.label }}</span>
            <span class="rank-track">
              <span :class="['rank-fill', { sel: item.id === role }]" :style="{ width: (item.openings / rankMax) * 100 + '%' }" />
              <span class="num">{{ fmtNum(item.openings) }}</span>
            </span>
          </button>
        </div>
        <p class="small muted">Click a role to see the IT salary trend.</p>
      </article>

      <article class="card c-6" aria-labelledby="emp-q">
        <div class="card-head"><h2 id="emp-q" class="q">Top employers</h2></div>
        <p v-if="!employerTop.length" class="muted"><b>No companies</b> in the saved ads for this role.</p>
        <ul v-else class="mini-list">
          <li v-for="e in employerTop" :key="e.name" class="mini-row">
            <span><b>{{ e.name }}</b></span>
          </li>
        </ul>
        <button type="button" class="btn btn-ghost link-btn" @click="go('employers')">All employers<Icon :path="ICON.arrow" small /></button>
      </article>

      <article class="card c-12" aria-labelledby="newpol-q">
        <div class="card-head"><h2 id="newpol-q" class="q">Newest policy items</h2></div>
        <p v-if="policyLoading" class="small muted">Loading policies…</p>
        <p v-else-if="!policyTop.length" class="muted"><b>No policy items yet.</b></p>
        <ul v-else class="mini-list pol-list">
          <li v-for="p in policyTop" :key="p.id">
            <span class="small muted">{{ fmtDate(p.publishedDate) }}</span>
            <b>{{ p.title }}</b>
          </li>
        </ul>
        <button type="button" class="btn btn-ghost link-btn" @click="go('policy')">All policy items<Icon :path="ICON.arrow" small /></button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.filters { display: flex; align-items: flex-end; gap: var(--space-3) var(--space-6); flex-wrap: wrap; }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-3); }
.tile {
  display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-1); padding: 20px;
  background: var(--color-surface); border: var(--border) solid var(--color-border);
  color: var(--color-text); text-align: left; cursor: pointer; transition: border-color .15s;
}
.tile:hover { border-color: var(--color-text); }
.tile-v { font-size: 28px; line-height: 36px; font-weight: 700; font-variant-numeric: tabular-nums; }
.tile-more { margin-top: auto; padding-top: 12px; display: inline-flex; align-items: center; gap: var(--space-1); font-size: 14px; font-weight: 600; color: var(--color-action); }
.tile:hover .tile-more { text-decoration: underline; text-underline-offset: 3px; }
.up, .down { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.rank { display: flex; flex-direction: column; gap: 8px; }
.rank-row {
  display: grid; grid-template-columns: 140px minmax(0, 1fr); gap: 12px; align-items: center;
  width: 100%; padding: 2px 0; color: var(--color-text); text-align: left; background: transparent; border: 0; cursor: pointer;
}
.rank-name { font-weight: 600; }
.rank-row:hover .rank-name { color: var(--color-action); }
.rank-track { display: flex; align-items: center; gap: var(--space-2); min-width: 0; }
.rank-fill { display: block; height: 24px; background: var(--color-text-muted); }
.rank-fill.sel { background: var(--color-action); }
.mini-list { display: flex; flex-direction: column; }
.mini-list li { display: flex; flex-direction: column; gap: var(--space-1); padding: 12px 0; border-top: var(--border) solid var(--color-border); }
.mini-list li:first-child { border-top: 0; padding-top: 0; }
.pol-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-4); }
.pol-list li, .pol-list li:first-child { border-top: 0; padding: 0 0 0 var(--space-3); border-left: var(--border) solid var(--color-border); }
.mini-list .mini-row { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; }
@media (max-width: 1023px) {
  .pol-list { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .pol-list li, .pol-list li:first-child { border-left: 0; padding: 12px 0; border-top: var(--border) solid var(--color-border); }
  .pol-list li:first-child { border-top: 0; padding-top: 0; }
}
@media (max-width: 639px) {
  .tile { padding: var(--space-3); }
  .tile-v { font-size: 22px; line-height: 28px; }
  .rank-row { grid-template-columns: 96px minmax(0, 1fr); }
}
</style>
