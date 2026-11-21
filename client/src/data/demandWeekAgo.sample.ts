/**
 * Invented daily open-ad counts for 14–20 Nov 2026.
 * Adzuna has no vacancy history for these searches. The chart appends
 * today's live count after this series. Do not cite these days as Adzuna.
 */
const DATES = ['2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20'] as const

const SERIES = {
  'web-developer': {
    en: [24, 22, 25, 23, 26, 28, 25],
    de: [49, 47, 50, 48, 45, 47, 44],
  },
  'it-support': {
    en: [690, 705, 688, 720, 710, 735, 726],
    de: [31, 29, 33, 30, 36, 32, 35],
  },
  'data-analyst': {
    en: [142, 138, 145, 140, 133, 139, 134],
    de: [6, 5, 8, 7, 6, 9, 8],
  },
} as const

export const DEMAND_WEEK_AGO = {
  asOf: DATES[0],
  note: 'Sample daily counts invented for the prototype. Adzuna has no vacancy history for these searches.',
} as const

export type DemandLang = 'en' | 'de'

export interface SampleDay {
  date: string
  openings: number
}

export function weekAgoOpenings(role: string, lang: DemandLang): number | null {
  return sampleDays(role, lang)[0]?.openings ?? null
}

export function sampleDays(role: string, lang: DemandLang): SampleDay[] {
  const row = SERIES[role as keyof typeof SERIES]
  const counts = row?.[lang]
  if (!counts) return []
  return DATES.map((date, i) => ({ date, openings: counts[i] }))
}
