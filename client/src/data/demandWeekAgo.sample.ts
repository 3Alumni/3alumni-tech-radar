/**
 * Invented open-ad counts from one week before the Adzuna pull (21 Nov 2026).
 * Adzuna does not give vacancy history for these searches, so this file is a
 * prototype stand-in. Do not cite it as Adzuna.
 */
export const DEMAND_WEEK_AGO = {
  asOf: '2026-11-14',
  note: 'Sample counts invented for the prototype. Adzuna has no vacancy history for these searches.',
  openings: {
    'web-developer': { en: 24, de: 49 },
    'it-support': { en: 690, de: 31 },
    'data-analyst': { en: 142, de: 6 },
  },
} as const

export type DemandLang = 'en' | 'de'

export function weekAgoOpenings(role: string, lang: DemandLang): number | null {
  const row = DEMAND_WEEK_AGO.openings[role as keyof typeof DEMAND_WEEK_AGO.openings]
  return row?.[lang] ?? null
}
