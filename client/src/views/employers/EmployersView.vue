<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { ICON, fmtNum, isExternalUrl } from '@/lib/format'
import { useEmployers, type EmployerGroup } from '@/composables/useEmployers'

const PAGE = 5
const ROLES = [
  { id: 'web-developer', label: 'Web developer' },
  { id: 'it-support', label: 'IT support' },
  { id: 'data-analyst', label: 'Data analyst' },
]

const role = ref(ROLES[0]!.id)
const hideAgency = ref(true)
const showAll = ref(false)
const { status, errorMessage, data } = useEmployers()

const roleLabel = computed(() => ROLES.find((item) => item.id === role.value)?.label ?? '')

function rows(groups: EmployerGroup[], agency: boolean) {
  return groups
    .map((group) => ({
      name: group.company,
      jobs: group.roles[role.value] ?? 0,
      agency,
      url: group.urls[0] ?? '',
    }))
    .filter((row) => row.jobs > 0)
}

const companies = computed(() => {
  const payload = data.value
  if (!payload) return []
  const direct = rows(payload.outreach, false)
  const agencies = hideAgency.value ? [] : rows(payload.agencies, true)
  return [...direct, ...agencies].sort((a, b) => b.jobs - a.jobs || a.name.localeCompare(b.name))
})
const list = computed(() => (showAll.value ? companies.value : companies.value.slice(0, PAGE)))

watch(role, () => {
  showAll.value = false
})

function resetFilters() {
  hideAgency.value = true
  role.value = ROLES[0]!.id
  showAll.value = false
}
</script>

<template>
  <section class="view" aria-labelledby="emp-h">
    <div class="card-head">
      <h1 id="emp-h" class="h1">Employers</h1>
    </div>

    <div class="filters">
      <div class="field seg-field">
        <span id="emp-role-l" class="label">Role</span>
        <div class="seg" role="group" aria-labelledby="emp-role-l">
          <button v-for="item in ROLES" :key="item.id" type="button" :aria-pressed="item.id === role" @click="role = item.id">
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <fieldset class="checks emp-filters">
      <legend class="sr">Filter companies</legend>
      <label class="check"><input v-model="hideAgency" type="checkbox" />Hide agencies</label>
    </fieldset>

    <p v-if="status === 'loading'" class="muted">Loading employers…</p>
    <p v-else-if="status === 'error'" class="muted">Could not load employers. {{ errorMessage }}</p>

    <template v-else>
      <div v-if="!companies.length" class="alert al-empty">
        <Icon :path="ICON.empty" />
        <span><b>No companies match.</b> Try another role or show agencies.</span>
        <button type="button" class="btn btn-ghost reset" @click="resetFilters">Reset filters</button>
      </div>
      <table v-else class="tbl cardify">
        <caption class="sr">Companies in the published jobs for {{ roleLabel }}</caption>
        <thead>
          <tr>
            <th scope="col">Company</th>
            <th scope="col">Published jobs</th>
            <th scope="col">Tags</th>
            <th scope="col"><span class="sr">Link</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in list" :key="e.name">
            <td data-label="Company"><b>{{ e.name }}</b></td>
            <td data-label="Published jobs" class="num">{{ fmtNum(e.jobs) }}</td>
            <td data-label="Tags">
              <span class="tags">
                <span v-if="e.agency" class="tag tag-agency">Agency</span>
              </span>
            </td>
            <td data-label="Link">
              <a v-if="isExternalUrl(e.url)" class="ext" :href="e.url" target="_blank" rel="noopener noreferrer">
                Job ad<span class="sr"> for {{ e.name }} (opens in a new tab)</span><Icon :path="ICON.external" small />
              </a>
              <span v-else class="small muted">Link coming</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="card-foot">
        <button
          v-if="companies.length > PAGE"
          type="button"
          class="btn btn-secondary"
          :aria-expanded="showAll"
          @click="showAll = !showAll"
        >{{ showAll ? 'Show fewer' : `Show all ${companies.length}` }}</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.view { gap: var(--space-4); }
.filters { display: flex; align-items: flex-end; gap: var(--space-3); flex-wrap: wrap; }
.emp-filters { display: flex; flex-wrap: wrap; gap: 0 var(--space-4); }
.alert { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; padding: 12px 16px; border: var(--border) solid; font-size: 14px; line-height: 20px; }
.al-empty { background: var(--color-bg); border-color: var(--color-border); }
.reset { margin-left: auto; }
/* Tags and the job-ad link share one centre line in every row */
.tbl td { vertical-align: middle; }
.tbl .tags { align-items: center; min-height: 28px; }
.tbl .tag { align-self: center; }
.tbl .ext { display: inline-flex; align-items: center; min-height: 28px; vertical-align: middle; }
@media (max-width: 639px) {
  .tbl.cardify td { align-items: center; }
}
</style>
