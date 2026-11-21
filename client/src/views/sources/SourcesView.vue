<script setup lang="ts">
import RadarLoader from '@/components/ui/RadarLoader.vue'
import { onMounted, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import DataAlerts from '@/components/ui/DataAlerts.vue'
import CardState from '@/components/ui/CardState.vue'
import { ICON, fmtDate, isExternalUrl } from '@/lib/format'
import { API } from '@/lib/api'

interface ApiSource {
  id: string
  title: string
  questions: string[]
  url: string
  enabled: boolean
  metricCount: number
  fetchedAt: string | null
}

const PURPOSE: Record<string, string> = {
  sem: 'Residence status, asylum and foreign-resident figures',
  fedlex: 'Laws and ordinances on asylum, status F and integration',
  adzuna: 'IT jobs',
  bfs: 'Labour-market statistics',
  esco: 'Skill names',
}

const USED: Record<string, string> = {
  A: 'Demand',
  B: 'Skills',
  C: 'Employers',
  D: 'People',
  E: 'Policy',
}

const sources = ref<ApiSource[]>([])
const loading = ref(false)
const error = ref('')

onMounted(() => {
  void load()
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${API}/sources`)
    if (!response.ok) throw new Error(`Sources API ${response.status}`)
    const rows = (await response.json()) as ApiSource[]
    sources.value = rows.filter((source) => source.enabled)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function usedIn(questions: string[]) {
  return questions.map((question) => USED[question] ?? question).join(', ')
}

function updated(source: ApiSource) {
  return source.fetchedAt ? fmtDate(source.fetchedAt.slice(0, 10)) : 'Not loaded yet'
}
</script>

<template>
  <section class="view" aria-labelledby="src-h">
    <div class="card-head">
      <h1 id="src-h" class="h1">Sources</h1>
      <p class="muted">Where every number comes from.</p>
    </div>
    <DataAlerts />

    <p v-if="error" class="small" role="alert">{{ error }}</p>
    <CardState :empty="!loading && !sources.length">
      <template #empty><b>No sources listed yet.</b></template>
      <RadarLoader v-if="loading" label="sources" />
      <table v-else class="tbl cardify src-tbl">
        <caption class="sr">Data sources used in Market Radar</caption>
        <colgroup>
          <col class="c-name" />
          <col class="c-what" />
          <col class="c-used" />
          <col class="c-date" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">What for</th>
            <th scope="col" class="center">Used in</th>
            <th scope="col" class="center">Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in sources" :key="s.id">
            <td data-label="Source">
              <a v-if="isExternalUrl(s.url)" class="ext" :href="s.url" target="_blank" rel="noopener noreferrer">
                <b>{{ s.title }}</b><span class="sr"> (opens in a new tab)</span><Icon :path="ICON.external" small />
              </a>
              <b v-else>{{ s.title }}</b>
            </td>
            <td data-label="What for">{{ PURPOSE[s.id] ?? s.id }}</td>
            <td data-label="Used in" class="center">{{ usedIn(s.questions) }}</td>
            <td data-label="Updated" class="num center">
              {{ updated(s) }}
            </td>
          </tr>
        </tbody>
      </table>
    </CardState>

    <p class="rule"><Icon :path="ICON.check" small />Official APIs and open data only</p>
  </section>
</template>

<style scoped>
.view { gap: var(--space-4); }
.rule { display: flex; align-items: center; gap: var(--space-2); }
.rule .ico { color: var(--color-success); }

/* Same table design as Employers: fixed columns, 880 px max, short columns centred */
.src-tbl { table-layout: fixed; max-width: 880px; }
.src-tbl th, .src-tbl td { padding: 14px var(--space-3); vertical-align: middle; }
.src-tbl .c-name { width: 220px; }
.src-tbl .c-used { width: 170px; }
.src-tbl .c-date { width: 130px; }
.src-tbl .center { text-align: center; }
.src-tbl td:first-child { overflow-wrap: anywhere; }
.src-tbl .ext { display: inline-flex; align-items: center; gap: 6px; }
@media (max-width: 639px) {
  .src-tbl { table-layout: auto; width: 100%; max-width: 100%; }
  .src-tbl .c-name,
  .src-tbl .c-used,
  .src-tbl .c-date { width: auto; }
  .src-tbl .center { text-align: left; }
  .src-tbl td:first-child { overflow-wrap: break-word; }
}
</style>
