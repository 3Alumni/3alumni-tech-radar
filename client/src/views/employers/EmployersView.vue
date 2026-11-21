<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import DataAlerts from '@/components/ui/DataAlerts.vue'
import CardState from '@/components/ui/CardState.vue'
import RoleRegionFilters from '@/components/ui/RoleRegionFilters.vue'
import { ICON, fmtNum, isExternalUrl } from '@/lib/format'
import { useInsights } from '@/composables/useInsights'
import { useSnapshot } from '@/composables/useSnapshot'

const PAGE = 5
const { canShow } = useSnapshot()
const ins = useInsights()
const { junior, partner, hideAgency } = ins
const showAll = ref(false)
const list = computed(() => (showAll.value ? ins.employersAll.value : ins.employersAll.value.slice(0, PAGE)))
</script>

<template>
  <section class="view" aria-labelledby="emp-h">
    <div class="card-head">
      <h1 id="emp-h" class="h1">Employers</h1>
      <p v-if="canShow" aria-live="polite">{{ ins.employersAnswer.value }}</p>
      <p v-else class="muted">Companies hiring for IT roles. Never individual people.</p>
    </div>
    <RoleRegionFilters />
    <DataAlerts />

    <fieldset class="checks emp-filters">
      <legend class="sr">Filter companies</legend>
      <label class="check"><input v-model="junior" type="checkbox" />Junior-friendly</label>
      <label class="check"><input v-model="partner" type="checkbox" />Our partners</label>
      <label class="check"><input v-model="hideAgency" type="checkbox" />Hide agencies</label>
    </fieldset>

    <CardState>
      <div v-if="!ins.employersAll.value.length" class="alert al-empty">
        <Icon :path="ICON.empty" />
        <span><b>No companies match.</b> Try another region or fewer filters.</span>
        <button type="button" class="btn btn-ghost reset" @click="ins.resetEmployerFilters">Reset filters</button>
      </div>
      <table v-else class="tbl cardify">
        <caption class="sr">Companies hiring for {{ ins.roleLabel.value }}</caption>
        <thead>
          <tr>
            <th scope="col">Company</th>
            <th scope="col">Open jobs</th>
            <th scope="col">Canton</th>
            <th scope="col">Tags</th>
            <th scope="col"><span class="sr">Link</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in list" :key="e.name">
            <td data-label="Company"><b>{{ e.name }}</b></td>
            <td data-label="Open jobs" class="num">{{ fmtNum(e.jobs) }}</td>
            <td data-label="Canton">{{ e.canton }}</td>
            <td data-label="Tags">
              <span class="tags">
                <span v-if="e.junior" class="tag tag-junior">Junior-friendly</span>
                <span v-if="e.partner" class="tag tag-partner">Partner</span>
                <span v-if="e.agency" class="tag tag-agency">Agency</span>
              </span>
            </td>
            <td data-label="Link">
              <a v-if="isExternalUrl(e.careersUrl)" class="ext" :href="e.careersUrl" target="_blank" rel="noopener noreferrer">
                Careers page<span class="sr"> of {{ e.name }} (opens in a new tab)</span><Icon :path="ICON.external" small />
              </a>
              <span v-else class="small muted">Link coming</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="card-foot">
        <button
          v-if="ins.employersAll.value.length > PAGE"
          type="button"
          class="btn btn-secondary"
          :aria-expanded="showAll"
          @click="showAll = !showAll"
        >{{ showAll ? 'Show fewer' : `Show all ${ins.employersAll.value.length}` }}</button>
      </div>
    </CardState>
  </section>
</template>

<style scoped>
.view { gap: var(--space-4); }
.emp-filters { display: flex; flex-wrap: wrap; gap: 0 var(--space-4); }
.alert { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; padding: 12px 16px; border: var(--border) solid; font-size: 14px; line-height: 20px; }
.al-empty { background: var(--color-bg); border-color: var(--color-border); }
.reset { margin-left: auto; }
</style>
