import { ref } from 'vue'

export interface SkillRow {
  label: string
  esco: string | null
  count: number
  roles: Record<string, number>
}

export interface SkillsPayload {
  basis: {
    postings: number
    model: string
    text: string
    sourceUrl: string
    dictionary: string
    dictionaryUrl: string
    skipped: number
  }
  esco: SkillRow[]
  own: SkillRow[]
}

const ROLES = ['web-developer', 'it-support', 'data-analyst'] as const

const byRole = ref<Record<string, SkillsPayload>>({})
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMessage = ref('')
let started = false

async function load() {
  status.value = 'loading'
  try {
    const rows = await Promise.all(
      ROLES.map(async (role) => {
        const res = await fetch(`/api/skills?role=${role}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return [role, (await res.json()) as SkillsPayload] as const
      }),
    )
    byRole.value = Object.fromEntries(rows)
    status.value = 'ready'
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : String(e)
    status.value = 'error'
  }
}

export function useSkills() {
  if (!started) {
    started = true
    void load()
  }
  return { status, errorMessage, byRole, reload: load }
}
