import type { Snapshot } from './types'

// Lightweight shape check: on mismatch the app shows the error state instead of broken charts.

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const isStr = (v: unknown): v is string => typeof v === 'string'
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isBool = (v: unknown): v is boolean => typeof v === 'boolean'
const isArr = Array.isArray
const isIsoDate = (v: unknown) => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v)
const isYm = (v: unknown) => isStr(v) && /^\d{4}-\d{2}$/.test(v)

export function validateSnapshot(raw: unknown): { ok: true; data: Snapshot } | { ok: false; error: string } {
  const fail = (where: string) => ({ ok: false as const, error: `Unexpected data shape at ${where}` })
  if (!isObj(raw)) return fail('root')
  if (!isIsoDate(raw.snapshotDate)) return fail('snapshotDate')
  if (!isArr(raw.roles)) return fail('roles')
  if (!isArr(raw.employers)) return fail('employers')
  if (!isArr(raw.policy)) return fail('policy')
  if (!isArr(raw.sources)) return fail('sources')

  for (const [i, r] of raw.roles.entries()) {
    const at = `roles[${i}]`
    if (!isObj(r) || !isStr(r.id) || !isStr(r.label)) return fail(at)
    if (!isNum(r.openAds30d) || !isNum(r.changeVs3mPct)) return fail(at + '.openAds30d/changeVs3mPct')
    if (!isArr(r.adsByMonth) || !r.adsByMonth.every((m) => isObj(m) && isYm(m.month) && isNum(m.count))) return fail(at + '.adsByMonth')
    if (!isArr(r.adsByCanton) || !r.adsByCanton.every((c) => isObj(c) && isStr(c.canton) && isNum(c.count))) return fail(at + '.adsByCanton')
    if (!isArr(r.skills) || !r.skills.every((s) => isObj(s) && isStr(s.name) && isNum(s.sharePct) && ['up', 'down', 'flat'].includes(s.trend as string) && isNum(s.rankJune) && isNum(s.rankNow))) return fail(at + '.skills')
    if (!isArr(r.avgSalaryByMonth) || !r.avgSalaryByMonth.every((m) => isObj(m) && isYm(m.month) && isNum(m.chf))) return fail(at + '.avgSalaryByMonth')
  }
  for (const [i, e] of raw.employers.entries()) {
    if (!isObj(e) || !isStr(e.name) || !isStr(e.canton) || !isObj(e.openJobs) || !isBool(e.junior) || !isBool(e.partner) || !isBool(e.agency) || !isStr(e.careersUrl)) return fail(`employers[${i}]`)
  }
  for (const [i, p] of raw.policy.entries()) {
    if (!isObj(p) || !isStr(p.id) || !['motion', 'law', 'stats'].includes(p.type as string) || !isStr(p.title) || !isIsoDate(p.publishedDate) || !isStr(p.sourceName) || !isStr(p.sourceUrl) || !isIsoDate(p.downloadedDate) || !isStr(p.summary) || !['high', 'medium', 'low'].includes(p.impact as string) || !isBool(p.isNew)) return fail(`policy[${i}]`)
  }
  for (const [i, s] of raw.sources.entries()) {
    if (!isObj(s) || !isStr(s.name) || !isStr(s.type) || !isArr(s.usedIn) || !isStr(s.purpose) || !isStr(s.url) || !isIsoDate(s.lastUpdate) || !isStr(s.attribution)) return fail(`sources[${i}]`)
  }
  return { ok: true, data: raw as unknown as Snapshot }
}
