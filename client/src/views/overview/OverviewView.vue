<script setup lang="ts">
import { computed } from 'vue'
import { mean } from 'd3'
import Icon from '@/components/ui/Icon.vue'
import DataAlerts from '@/components/ui/DataAlerts.vue'
import CardState from '@/components/ui/CardState.vue'
import SourceChip from '@/components/ui/SourceChip.vue'
import RoleRegionFilters from '@/components/ui/RoleRegionFilters.vue'
import RoleRaceChart from '@/components/charts/RoleRaceChart.vue'
import SkillBars from '@/components/charts/SkillBars.vue'
import { ICON, fmtChf, fmtDate, fmtMonth, fmtNum } from '@/lib/format'
import { useSnapshot } from '@/composables/useSnapshot'
import { useInsights, IMPACT_LABEL } from '@/composables/useInsights'
import { useView } from '@/composables/useView'
import { useSalaryDialog } from '@/composables/useSalaryDialog'
import { useCountUp } from '@/composables/useMotion'

const { snapshot, roles, newPolicyCount, canShow } = useSnapshot()
const ins = useInsights()
const { go } = useView()
const salary = useSalaryDialog()

const kpiShown = useCountUp(ins.kpiValue)

const sal = computed(() => ins.currentRole.value?.avgSalaryByMonth ?? [])
const salAvg = computed(() => Math.round((mean(sal.value, (m) => m.chf) ?? 0) / 100) * 100)
const salPct = computed(() => {
  const a = sal.value[0]
  const b = sal.value[sal.value.length - 1]
  return a && b ? Math.round((b.chf / a.chf - 1) * 1000) / 10 : 0
})
const salSince = computed(() => (sal.value[0] ? fmtMonth(sal.value[0].month) : ''))

const policyTop = computed(() => ins.policySorted.value.slice(0, 3))
const empTop = computed(() => ins.employersAll.value.slice(0, 4))
const sourceCount = computed(() => snapshot.value?.sources.length ?? 0)
</script>

<template>
  <section class="view" aria-labelledby="ov-h">
    <div class="page-head">
      <div class="card-head">
        <h1 id="ov-h" class="h1">Overview</h1>
        <p class="muted">Where the IT jobs are, which skills to teach, and what is changing.</p>
      </div>
      <div class="page-actions">
        <button type="button" class="btn btn-secondary" @click="go('sources')">Sources</button>
        <button type="button" class="btn btn-primary" @click="go('subscribe')">Get email summary</button>
      </div>
    </div>

    <RoleRegionFilters />
    <DataAlerts />

    <div v-if="canShow" class="tiles">
      <button type="button" class="tile" @click="go('demand')">
        <span class="small muted">Open job ads · {{ ins.roleLabel.value }}</span>
        <span class="tile-v">{{ fmtNum(kpiShown) }}</span>
        <span :class="ins.changeUp.value ? 'up' : 'down'"><Icon :path="ins.changeUp.value ? ICON.up : ICON.down" small />{{ ins.changeText.value }}</span>
        <span class="tile-more">Demand<Icon :path="ICON.arrow" small /></span>
      </button>
      <button type="button" class="tile" @click="go('demand')">
        <span class="small muted">Most job ads in</span>
        <span class="tile-v">{{ ins.topCanton.value }}</span>
        <span class="small muted">for {{ ins.roleLabel.value }}</span>
        <span class="tile-more">Demand<Icon :path="ICON.arrow" small /></span>
      </button>
      <button type="button" class="tile" @click="go('skills')">
        <span class="small muted">Rising skill</span>
        <span class="tile-v">{{ ins.risingSkill.value }}</span>
        <span class="small muted">for {{ ins.roleLabel.value }}</span>
        <span class="tile-more">Skills<Icon :path="ICON.arrow" small /></span>
      </button>
      <button type="button" class="tile" @click="go('policy')">
        <span class="small muted">New policy items</span>
        <span class="tile-v">{{ newPolicyCount }}</span>
        <span v-if="snapshot?.previousSnapshotDate" class="small muted">since {{ fmtDate(snapshot.previousSnapshotDate) }}</span>
        <span class="tile-more">Policy<Icon :path="ICON.arrow" small /></span>
      </button>
    </div>

    <div class="grid">
      <article class="card c-6" aria-labelledby="race-q">
        <div class="card-head">
          <h2 id="race-q" class="q">Which role has the most job ads?</h2>
          <p v-if="canShow">{{ ins.raceAnswer.value }}</p>
        </div>
        <CardState :lines="[90, 70, 50]" :line-height="32">
          <template #empty><b>No job ads yet.</b> Check again after the next data update.</template>
          <RoleRaceChart :roles="roles" :selected-id="ins.currentRole.value?.id ?? ''" @open="salary.open" />
          <SourceChip :names="['Adzuna']" />
        </CardState>
      </article>

      <article class="card c-3" aria-labelledby="sal-q">
        <div class="card-head">
          <h2 id="sal-q" class="q">Average salary</h2>
          <p class="muted small">{{ ins.roleLabel.value }} · last 12 months</p>
        </div>
        <CardState :lines="[60, 40]" :line-height="32" :empty="!sal.length">
          <span class="big sal-big">{{ fmtChf(salAvg) }}</span>
          <span :class="salPct >= 0 ? 'up' : 'down'"><Icon :path="salPct >= 0 ? ICON.up : ICON.down" small />{{ salPct >= 0 ? '+' : '−' }}{{ Math.abs(salPct) }}% since {{ salSince }}</span>
          <button type="button" class="btn btn-secondary push" @click="salary.open(ins.currentRole.value?.id ?? '')">Open salary chart</button>
        </CardState>
      </article>

      <article class="card c-3" aria-labelledby="newpol-q">
        <div class="card-head"><h2 id="newpol-q" class="q">Newest policy items</h2></div>
        <CardState :empty="!policyTop.length">
          <template #empty><b>No policy items yet.</b></template>
          <ul class="mini-list">
            <li v-for="p in policyTop" :key="p.id">
              <span class="small muted">{{ fmtDate(p.publishedDate) }}</span>
              <b>{{ p.title }}</b>
              <span :class="['tag', 'imp-' + p.impact]">{{ IMPACT_LABEL[p.impact] }}</span>
            </li>
          </ul>
        </CardState>
        <button type="button" class="btn btn-ghost link-btn" @click="go('policy')">All policy items<Icon :path="ICON.arrow" small /></button>
      </article>

      <article class="card c-5" aria-labelledby="emp-q">
        <div class="card-head"><h2 id="emp-q" class="q">Top employers · {{ ins.roleLabel.value }}</h2></div>
        <CardState :empty="!empTop.length">
          <template #empty><b>No companies match.</b> Try another region.</template>
          <ul class="mini-list">
            <li v-for="e in empTop" :key="e.name" class="mini-row">
              <span><b>{{ e.name }}</b><br /><span class="small muted">{{ e.canton }} · {{ fmtNum(e.jobs) }} open jobs</span></span>
              <span class="tags">
                <span v-if="e.junior" class="tag tag-junior">Junior-friendly</span>
                <span v-if="e.partner" class="tag tag-partner">Partner</span>
              </span>
            </li>
          </ul>
        </CardState>
        <button type="button" class="btn btn-ghost link-btn" @click="go('employers')">All employers<Icon :path="ICON.arrow" small /></button>
      </article>

      <article class="card c-4" aria-labelledby="sk-q">
        <div class="card-head"><h2 id="sk-q" class="q">Top skills · {{ ins.roleLabel.value }}</h2></div>
        <CardState :empty="!ins.skills.value.length">
          <SkillBars :skills="ins.skills.value" :role-label="ins.roleLabel.value" compact />
        </CardState>
        <button type="button" class="btn btn-ghost link-btn" @click="go('skills')">All skills<Icon :path="ICON.arrow" small /></button>
      </article>

      <article class="card c-3" aria-labelledby="snap-q">
        <div class="card-head"><h2 id="snap-q" class="q">Data snapshot</h2></div>
        <CardState :lines="[70]" :line-height="28">
          <span v-if="snapshot" class="snap-date">{{ fmtDate(snapshot.snapshotDate) }}</span>
          <p class="small muted">{{ sourceCount }} sources · official APIs and open data only</p>
        </CardState>
        <button type="button" class="btn btn-ghost link-btn" @click="go('sources')">View sources<Icon :path="ICON.arrow" small /></button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--space-3); }
.tile {
  display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-1); padding: 20px;
  background: var(--color-surface); border: var(--border) solid var(--color-border);
  color: var(--color-text); text-align: left; cursor: pointer; transition: border-color .15s;
}
.tile:hover { border-color: var(--color-text); }
.tile-v { font-size: 28px; line-height: 36px; font-weight: 700; font-variant-numeric: tabular-nums; }
.tile-more { margin-top: auto; padding-top: 12px; display: inline-flex; align-items: center; gap: var(--space-1); font-size: 14px; font-weight: 600; color: var(--color-action); }
.tile:hover .tile-more { text-decoration: underline; text-underline-offset: 3px; }
.mini-list { display: flex; flex-direction: column; }
.mini-list li { display: flex; flex-direction: column; gap: var(--space-1); padding: 12px 0; border-top: var(--border) solid var(--color-border); }
.mini-list li:first-child { border-top: 0; padding-top: 0; }
.mini-list .mini-row { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; }
.push { margin-top: auto; align-self: flex-start; }
.sal-big { font-size: 32px; line-height: 40px; white-space: nowrap; }
.snap-date { font-size: 28px; line-height: 36px; font-weight: 700; }
@media (max-width: 1023px) {
  .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 639px) {
  .tile { padding: var(--space-3); }
  .tile-v { font-size: 22px; line-height: 28px; }
}
</style>
