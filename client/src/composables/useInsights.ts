import { computed } from 'vue'
import { descending } from 'd3'
import { useSnapshot } from './useSnapshot'
import { useFilters } from './useFilters'
import { fmtMonth, fmtNum, fmtPct } from '@/lib/format'
import type { PolicyItem } from '@/lib/types'

/** Derived numbers and plain-language answers, computed only from the snapshot (never invented). */

export const POLICY_TYPE_LABEL: Record<PolicyItem['type'], string> = {
  motion: 'Parliament motion',
  law: 'Law or rule',
  stats: 'Statistics',
}
export const IMPACT_LABEL: Record<PolicyItem['impact'], string> = {
  high: 'High impact',
  medium: 'Medium impact',
  low: 'Low impact',
}

export function useInsights() {
  const { snapshot, roles } = useSnapshot()
  const f = useFilters()

  // Demand
  const change = computed(() => f.currentRole.value?.changeVs3mPct ?? 0)
  const changeUp = computed(() => change.value >= 0)
  const changeShort = computed(() => fmtPct(change.value, true))
  const changeText = computed(() => `${changeShort.value} vs 3 months ago`)
  const cantonCount = computed(
    () => f.currentRole.value?.adsByCanton.find((c) => c.canton === f.region.value)?.count ?? 0,
  )
  const kpiValue = computed(() =>
    f.region.value === 'all' ? (f.currentRole.value?.openAds30d ?? 0) : cantonCount.value,
  )
  const kpiLabel = computed(() =>
    f.region.value === 'all' ? 'open job ads, last 30 days' : `open job ads in ${f.region.value}`,
  )
  const kpiAnswer = computed(() =>
    kpiValue.value === 0
      ? 'Not right now: there are no open jobs for this role and region.'
      : changeUp.value
        ? `Yes. Jobs rose ${changeShort.value} over the last 3 months.`
        : `Yes, but fewer than before: jobs fell ${Math.abs(change.value)}% over the last 3 months.`,
  )
  const cantonsSorted = computed(() =>
    [...(f.currentRole.value?.adsByCanton ?? [])].sort((a, b) => descending(a.count, b.count)),
  )
  const topCanton = computed(() => cantonsSorted.value[0]?.canton ?? '—')
  const cantonAnswer = computed(() => {
    const [a, b] = cantonsSorted.value
    if (!a) return 'No canton data yet.'
    return `Most jobs are in ${a.canton}${b ? ', then ' + b.canton : ''}. Click a canton to filter.`
  })
  const trendPoints = computed(() =>
    (f.currentRole.value?.adsByMonth ?? []).map((m) => ({
      key: m.month,
      label: fmtMonth(m.month),
      short: fmtMonth(m.month).split(' ')[0]!,
      value: m.count,
    })),
  )
  const trendAria = computed(() => {
    const p = trendPoints.value
    if (!p.length) return ''
    return `${f.roleLabel.value} jobs per month in Switzerland, ${fmtMonth(p[0]!.key, true)} to ${fmtMonth(p[p.length - 1]!.key, true)}: from ${fmtNum(p[0]!.value)} to ${fmtNum(p[p.length - 1]!.value)}`
  })

  // Role race
  const raceAnswer = computed(() => {
    const rs = roles.value
      .filter((r) => r.adsByMonth.length)
      .map((r) => {
        const first = r.adsByMonth[0]!.count
        const last = r.adsByMonth[r.adsByMonth.length - 1]!.count
        return { label: r.label, last, growth: first ? last / first : 0 }
      })
    if (!rs.length) return ''
    const top = [...rs].sort((a, b) => descending(a.last, b.last))[0]!
    const fastest = [...rs].sort((a, b) => descending(a.growth, b.growth))[0]!
    const since = fmtMonth(roles.value[0]!.adsByMonth[0]!.month, true).split(' ')[0]
    return top.label === fastest.label
      ? `${top.label} has the most jobs and grew fastest since ${since}.`
      : `${top.label} has the most jobs. ${fastest.label} grew fastest since ${since}.`
  })

  // Skills
  const skills = computed(() => f.currentRole.value?.skills ?? [])
  const risingSkill = computed(
    () => [...skills.value].sort((a, b) => descending(a.rankJune - a.rankNow, b.rankJune - b.rankNow))[0]?.name ?? '—',
  )
  const skillAnswer = computed(() => {
    const [a, b] = skills.value
    if (!a) return ''
    return `${a.name}${b ? ' and ' + b.name : ''} come up most often. ${risingSkill.value} is rising fastest.`
  })

  // Employers
  const employersAll = computed(() => {
    const role = f.currentRole.value?.id ?? ''
    return (snapshot.value?.employers ?? [])
      .filter((e) => (e.openJobs[role] ?? 0) > 0)
      .filter((e) => f.region.value === 'all' || e.canton === f.region.value)
      .filter((e) => !f.junior.value || e.junior)
      .filter((e) => !f.partner.value || e.partner)
      .filter((e) => !f.hideAgency.value || !e.agency)
      .sort((a, b) => descending(a.openJobs[role] ?? 0, b.openJobs[role] ?? 0))
      .map((e) => ({ ...e, jobs: e.openJobs[role] ?? 0 }))
  })
  const employersAnswer = computed(() => {
    const n = employersAll.value.length
    if (!n) return 'No companies match these filters.'
    const partners = employersAll.value.filter((e) => e.partner).length
    const where = f.region.value === 'all' ? '' : ' in ' + f.region.value
    return `${n} ${n === 1 ? 'company is' : 'companies are'} hiring for ${f.roleLabel.value}${where}, ${partners} of them our partners.`
  })

  // Policy
  const policySorted = computed(() =>
    [...(snapshot.value?.policy ?? [])].sort((a, b) => descending(a.publishedDate, b.publishedDate)),
  )

  return {
    ...f,
    change, changeUp, changeShort, changeText,
    kpiValue, kpiLabel, kpiAnswer,
    cantonsSorted, topCanton, cantonAnswer,
    trendPoints, trendAria,
    raceAnswer,
    skills, risingSkill, skillAnswer,
    employersAll, employersAnswer,
    policySorted,
  }
}
