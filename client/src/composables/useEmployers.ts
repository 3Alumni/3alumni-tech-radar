import { ref } from 'vue'

export interface EmployerGroup {
  company: string
  postings: number
  roles: Record<string, number>
  reason: string | null
  urls: string[]
}

export interface EmployersPayload {
  basis: { postings: number; sourceUrl: string }
  outreach: EmployerGroup[]
  agencies: EmployerGroup[]
}

const data = ref<EmployersPayload | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMessage = ref('')
let started = false

async function load() {
  status.value = 'loading'
  try {
    const res = await fetch('/api/employers')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = (await res.json()) as EmployersPayload
    status.value = 'ready'
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : String(e)
    status.value = 'error'
  }
}

export function useEmployers() {
  if (!started) {
    started = true
    void load()
  }
  return { status, errorMessage, data, reload: load }
}
