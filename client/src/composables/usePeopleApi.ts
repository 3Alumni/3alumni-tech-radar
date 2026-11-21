import { computed, ref } from 'vue'
import { API } from '@/lib/api'

interface PeopleMetric {
  label: string
  value: number | string
  geo?: string
  period?: string
  sourceUrl: string
  fetchedAt: string
}

export interface PeopleCard {
  label: string
  value: number
  period?: string
  sourceUrl: string
  fetchedAt: string
}

export interface PeopleGroup {
  title: string
  cards: PeopleCard[]
  rows: PeopleCard[]
  sourceUrl: string
  fetchedAt: string
}

const metrics = ref<PeopleMetric[]>([])
const loading = ref(false)
const error = ref('')
let pending: Promise<void> | null = null

export function usePeopleApi() {
  return { groups: computed(() => group(metrics.value)), loading, error, ensure }
}

async function ensure() {
  if (!pending) pending = load()
  await pending
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${API}/people`)
    if (!response.ok) throw new Error(`People API ${response.status}`)
    metrics.value = (await response.json()) as PeopleMetric[]
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    pending = null
  } finally {
    loading.value = false
  }
}

const SECTIONS: {
  title: string
  cards: string[]
  rowPrefix?: string
  /** Canton rows use a canton geo. National breakdowns stay on CH. */
  cantonRows?: boolean
  extras?: (label: string) => boolean
}[] = [
  {
    title: 'Status F',
    cards: ['Residence status F', 'Status F in work', 'Status F in work, change since previous month'],
    rowPrefix: 'Residence status F, ',
    cantonRows: true,
  },
  {
    title: 'Status S',
    cards: ['Residence status S', 'Status S in work'],
    rowPrefix: 'Residence status S, ',
    cantonRows: true,
  },
  {
    title: 'Asylum process',
    cards: [
      'People in the asylum process',
      'Residence status N',
      'Status N in work',
      'Status N in work, change since previous month',
    ],
  },
  {
    title: 'Foreign residents',
    cards: ['Foreign residents'],
    rowPrefix: 'Foreign residents, ',
    extras: (label) => label.startsWith('Foreign residents from '),
  },
  {
    title: 'Recognized refugees',
    cards: ['Recognized refugees'],
    rowPrefix: 'Recognized refugees, ',
  },
  {
    title: 'Non-permanent residents in work',
    cards: ['Non-permanent residents in work'],
    rowPrefix: 'Non-permanent residents in work, ',
  },
  {
    title: 'Immigration with work',
    cards: ['Immigration with work'],
    rowPrefix: 'Immigration with work, ',
  },
]

function group(rows: PeopleMetric[]): PeopleGroup[] {
  return SECTIONS.map((section) => {
    const cards = section.cards
      .map((label) => rows.find((row) => row.label === label))
      .filter((row): row is PeopleMetric => Boolean(row))
      .map(toCard)
    const breakdowns = rows
      .filter((row) => {
        if (section.rowPrefix && row.label.startsWith(section.rowPrefix)) {
          return section.cantonRows ? row.geo !== 'CH' : row.geo === 'CH' || !row.geo
        }
        return section.extras?.(row.label) ?? false
      })
      .map((row) => ({
        ...toCard(row),
        label: section.rowPrefix && row.label.startsWith(section.rowPrefix)
          ? row.label.slice(section.rowPrefix.length)
          : row.label.replace(/^Foreign residents from /, 'From '),
      }))
      .sort((a, b) => b.value - a.value)
    const sample = cards[0] ?? breakdowns[0]
    return {
      title: section.title,
      cards,
      rows: breakdowns,
      sourceUrl: sample?.sourceUrl ?? '',
      fetchedAt: sample?.fetchedAt ?? '',
    }
  }).filter((section) => section.cards.length || section.rows.length)
}

function toCard(row: PeopleMetric): PeopleCard {
  const value = typeof row.value === 'number' ? row.value : Number(row.value)
  return {
    label: row.label,
    value: Number.isFinite(value) ? value : 0,
    period: row.period,
    sourceUrl: row.sourceUrl,
    fetchedAt: row.fetchedAt.slice(0, 10),
  }
}
