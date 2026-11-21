<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import DataAlerts from '@/components/ui/DataAlerts.vue'
import CardState from '@/components/ui/CardState.vue'
import RoleRegionFilters from '@/components/ui/RoleRegionFilters.vue'
import RoleRaceChart from '@/components/charts/RoleRaceChart.vue'
import { ICON, fmtDate, fmtNum } from '@/lib/format'
import { useSnapshot } from '@/composables/useSnapshot'
import { useInsights } from '@/composables/useInsights'
import { useView } from '@/composables/useView'
import { useSalaryDialog } from '@/composables/useSalaryDialog'
import { useCountUp } from '@/composables/useMotion'

const { snapshot, roles, newPolicyCount, canShow } = useSnapshot()
const ins = useInsights()
const { go } = useView()
const salary = useSalaryDialog()

const kpiShown = useCountUp(ins.kpiValue)

const policyTop = computed(() => ins.policySorted.value.slice(0, 3))
const empTop = computed(() => ins.employersAll.value.slice(0, 4))
</script>

<template>
  <section class="view" aria-labelledby="ov-h">
    <div class="page-head">
      <div class="card-head">
        <h1 id="ov-h" class="h1">Overview</h1>
        <p class="muted">Where the IT jobs are, which skills to teach, and what is changing.</p>
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
        </CardState>
      </article>

      <article class="card c-6" aria-labelledby="emp-q">
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

      <article class="card c-12" aria-labelledby="newpol-q">
        <div class="card-head"><h2 id="newpol-q" class="q">Newest policy items</h2></div>
        <CardState :empty="!policyTop.length">
          <template #empty><b>No policy items yet.</b></template>
          <ul class="mini-list pol-list">
            <li v-for="p in policyTop" :key="p.id">
              <span class="small muted">{{ fmtDate(p.publishedDate) }}</span>
              <b>{{ p.title }}</b>
            </li>
          </ul>
        </CardState>
        <button type="button" class="btn btn-ghost link-btn" @click="go('policy')">All policy items<Icon :path="ICON.arrow" small /></button>
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
/* Policy: three newest items side by side on wide screens */
.pol-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-4); }
.pol-list li, .pol-list li:first-child { border-top: 0; padding: 0 0 0 var(--space-3); border-left: var(--border) solid var(--color-border); }
.mini-list .mini-row { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; }
@media (max-width: 1023px) {
  .pol-list { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .pol-list li, .pol-list li:first-child { border-left: 0; padding: 12px 0; border-top: var(--border) solid var(--color-border); }
  .pol-list li:first-child { border-top: 0; padding-top: 0; }
  .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 639px) {
  .tile { padding: var(--space-3); }
  .tile-v { font-size: 22px; line-height: 28px; }
}
</style>
