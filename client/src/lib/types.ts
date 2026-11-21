// Data contract agreed with the backend devs. See client/CLAUDE.md "Data the frontend expects".

export type RoleId = string
export type Trend = 'up' | 'down' | 'flat'
export type Impact = 'high' | 'medium' | 'low'
export type PolicyType = 'motion' | 'law' | 'stats'

export interface MonthCount { month: string; count: number }
export interface CantonCount { canton: string; count: number }
export interface MonthSalary { month: string; chf: number }

export interface Skill {
  name: string
  sharePct: number
  trend: Trend
  rankJune: number
  rankNow: number
}

export interface Role {
  id: RoleId
  label: string
  adsByMonth: MonthCount[]
  openAds30d: number
  changeVs3mPct: number
  adsByCanton: CantonCount[]
  skills: Skill[]
  avgSalaryByMonth: MonthSalary[]
}

export interface Employer {
  name: string
  canton: string
  openJobs: Record<RoleId, number>
  junior: boolean
  partner: boolean
  agency: boolean
  careersUrl: string
}

export interface PolicyItem {
  id: string
  type: PolicyType
  title: string
  publishedDate: string
  sourceName: string
  sourceUrl: string
  downloadedDate: string
  summary: string
  impact: Impact
  isNew: boolean
}

export interface Source {
  name: string
  type: string
  usedIn: string[]
  purpose: string
  url: string
  lastUpdate: string
  attribution: string
}

export interface Snapshot {
  _note?: string
  snapshotDate: string
  previousSnapshotDate?: string
  roles: Role[]
  employers: Employer[]
  policy: PolicyItem[]
  sources: Source[]
}
