<script setup lang="ts">
import Icon from '@/components/ui/Icon.vue'
import DataAlerts from '@/components/ui/DataAlerts.vue'
import CardState from '@/components/ui/CardState.vue'
import SourceChip from '@/components/ui/SourceChip.vue'
import RoleRegionFilters from '@/components/ui/RoleRegionFilters.vue'
import TrendLine from '@/components/charts/TrendLine.vue'
import CantonBars from '@/components/charts/CantonBars.vue'
import { ICON, fmtNum } from '@/lib/format'
import { useInsights } from '@/composables/useInsights'
import { useSalaryDialog } from '@/composables/useSalaryDialog'
import { useSnapshot } from '@/composables/useSnapshot'
import { useCountUp } from '@/composables/useMotion'

const { canShow } = useSnapshot()
const ins = useInsights()
const salary = useSalaryDialog()
const kpiShown = useCountUp(ins.kpiValue)
</script>

<template>
  <section class="view" aria-labelledby="demand-h">
    <div class="card-head">
      <h1 id="demand-h" class="h1">Demand</h1>
      <p class="muted">Is there work for this role, and where?</p>
    </div>
    <RoleRegionFilters />
    <DataAlerts />

    <div class="cards">
      <article class="card" aria-labelledby="kpi-q">
        <div class="card-head">
          <h2 id="kpi-q" class="q">Is there work for {{ ins.roleLabel.value }}?</h2>
          <p v-if="canShow" aria-live="polite">{{ ins.kpiAnswer.value }}</p>
        </div>
        <CardState :lines="[40, 100]" :line-height="40">
          <template #empty><b>No job ads yet</b> for this role and region. Try All of Switzerland.</template>
          <div class="kpi">
            <span class="big">{{ fmtNum(kpiShown) }}</span>
            <span class="muted small kpi-note">{{ ins.kpiLabel.value }}</span>
            <span :class="[ins.changeUp.value ? 'up' : 'down', 'kpi-note', 'kpi-push']">
              <Icon :path="ins.changeUp.value ? ICON.up : ICON.down" small />{{ ins.changeText.value }}
            </span>
          </div>
          <button type="button" class="btn btn-ghost sal-link" @click="salary.open(ins.currentRole.value?.id ?? '')">
            Average salary for {{ ins.roleLabel.value }}<Icon :path="ICON.arrow" small />
          </button>
          <TrendLine :points="ins.trendPoints.value" :summary="ins.trendAria.value" />
          <SourceChip :names="['Adzuna']" />
        </CardState>
      </article>

      <article class="card" aria-labelledby="canton-q">
        <div class="card-head">
          <h2 id="canton-q" class="q">Where are the jobs?</h2>
          <p v-if="canShow">{{ ins.cantonAnswer.value }}</p>
        </div>
        <CardState :empty="!ins.cantonsSorted.value.length">
          <template #empty><b>No job ads yet</b> for this role in any canton.</template>
          <CantonBars
            :cantons="ins.cantonsSorted.value"
            :selected="ins.region.value"
            @pick="ins.toggleRegion"
          />
          <SourceChip :names="['Adzuna', 'BFS']" />
        </CardState>
      </article>
    </div>
  </section>
</template>

<style scoped>
.sal-link { align-self: flex-start; margin-left: -12px; }
</style>
