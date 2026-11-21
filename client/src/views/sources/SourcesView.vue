<script setup lang="ts">
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
  adzuna: 'Job ads for IT roles',
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
      <p v-if="loading" class="small muted">Loading sources…</p>
      <table v-else class="tbl cardify">
        <caption class="sr">Data sources used in Market Radar</caption>
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">What for</th>
            <th scope="col">Used in</th>
            <th scope="col">Updated</th>
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
            <td data-label="Used in">{{ usedIn(s.questions) }}</td>
            <td data-label="Updated" class="num">
              {{ updated(s) }}
              <span v-if="s.metricCount" class="small muted"><br />{{ s.metricCount }} figures</span>
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
</style>
