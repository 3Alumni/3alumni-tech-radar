import { ref } from 'vue'
import { API } from '@/lib/api'

interface PolicyMetric {
  label: string
  value: string | number
  period?: string
  reference?: string
  sourceId: string
  sourceUrl: string
  text?: string
  fetchedAt: string
}

interface ActBriefing {
  titleEn?: string
  text: string
  keyChanges?: string[]
  keyUpdates?: string[]
}

export interface LivePolicy {
  id: string
  title: string
  originalTitle: string
  publishedDate: string
  sourceName: string
  sourceUrl: string
  summary: string
  keyChanges: string[]
  keyUpdates: string[]
  isNew: boolean
}

const SOURCE_NAMES: Record<string, string> = {
  fedlex: 'Fedlex',
  sem: 'State Secretariat for Migration',
}

const items = ref<LivePolicy[]>([])
const loading = ref(false)
const error = ref('')
let pending: Promise<void> | null = null
let summarized = false
const textByUrl = new Map<string, string>()

export function usePolicyApi() {
  return { items, loading, error, ensure, summarize }
}

async function ensure() {
  if (!pending) pending = load()
  await pending
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${API}/policy`)
    if (!response.ok) throw new Error(`Policy API ${response.status}`)
    const rows = (await response.json()) as PolicyMetric[]
    for (const row of rows) {
      if (row.text) textByUrl.set(row.sourceUrl, row.text)
    }
    items.value = rows
      .map(toItem)
      .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    pending = null
  } finally {
    loading.value = false
  }
}

/** English titles and key changes. Only the policy page asks for these. */
function summarize() {
  if (summarized) return
  summarized = true
  void fillSummaries(items.value, (id, partial) => {
    items.value = items.value.map((item) => (item.id === id ? { ...item, ...partial } : item))
  })
}

function toItem(row: PolicyMetric): LivePolicy {
  const publishedDate = String(row.value ?? row.period ?? row.fetchedAt).slice(0, 10)
  return {
    id: row.reference || row.sourceUrl,
    title: row.label,
    originalTitle: row.label,
    publishedDate,
    sourceName: SOURCE_NAMES[row.sourceId] ?? row.sourceId,
    sourceUrl: row.sourceUrl,
    summary: row.text ? '' : 'This record has no act text.',
    keyChanges: [],
    keyUpdates: [],
    isNew: daysSince(publishedDate) <= 45,
  }
}

async function fillSummaries(
  list: LivePolicy[],
  apply: (id: string, partial: Partial<LivePolicy>) => void,
) {
  const queue = list.filter((item) => item.summary === '')
  let cursor = 0
  async function worker() {
    while (cursor < queue.length) {
      const item = queue[cursor++]
      if (!item) return
      try {
        const response = await fetch(`${API}/summaries/act`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title: item.originalTitle,
            text: textByUrl.get(item.sourceUrl) ?? item.originalTitle,
            sourceUrl: item.sourceUrl,
            reference: item.id,
          }),
        })
        if (!response.ok) throw new Error(`Summary ${response.status}`)
        const briefing = (await response.json()) as ActBriefing
        apply(item.id, {
          summary: briefing.text,
          title: briefing.titleEn && briefing.titleEn !== item.originalTitle ? briefing.titleEn : item.title,
          keyChanges: briefing.keyChanges ?? [],
          keyUpdates: briefing.keyUpdates ?? [],
        })
      } catch (e) {
        apply(item.id, { summary: e instanceof Error ? e.message : String(e) })
      }
    }
  }
  await Promise.all([worker(), worker(), worker()])
}

function daysSince(iso: string): number {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return 999
  return (Date.now() - then) / 86_400_000
}
