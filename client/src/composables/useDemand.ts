import { computed, ref } from 'vue'
import { API } from '@/lib/api'

export interface DemandQuery {
  role: string
  query: string
  lang: string | null
  openings: number
  sampleSize: number
  sourceUrl: string
  fetchedAt: string
  unknownCanton: number
  cantons: { canton: string; postings: number }[]
}

export interface SalaryTrend {
  category: string
  label: string
  currency: 'CHF'
  sourceUrl: string
  fetchedAt: string
  months: { month: string; salary: number }[]
}

interface DemandResponse {
  roles: DemandQuery[]
  salaryTrend: SalaryTrend | null
}

const data = ref<DemandResponse | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMessage = ref('')
let started = false

const MAP_NAME: Record<string, string> = {
  'kanton zurich': 'Zürich',
  'kanton bern': 'Bern',
  'kanton aargau': 'Aargau',
  'kanton basel-stadt': 'Basel-Stadt',
  'kanton genf': 'Geneva',
  'kanton tessin': 'Ticino',
  'kanton waadt': 'Vaud',
}

export function cantonMapName(name: string): string {
  const key = name.replace(/^kanton\s+/i, 'kanton ').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  return MAP_NAME[key] ?? name.replace(/^Kanton\s+/i, '')
}

async function load() {
  status.value = 'loading'
  try {
    const res = await fetch(`${API}/demand`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = (await res.json()) as DemandResponse
    status.value = 'ready'
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : String(e)
    status.value = 'error'
  }
}

export function useDemand() {
  if (!started) {
    started = true
    void load()
  }
  const queries = computed(() => data.value?.roles ?? [])
  const salaryTrend = computed(() => data.value?.salaryTrend ?? null)
  return { status, errorMessage, queries, salaryTrend, reload: load }
}
