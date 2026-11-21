// Swiss number format (1'240) and plain dates (20 Nov 2026).

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function fmtNum(n: number): string {
  const sign = n < 0 ? '−' : ''
  return sign + String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, "'")
}

export function fmtChf(n: number): string {
  return 'CHF ' + fmtNum(n)
}

export function fmtPct(n: number, signed = false): string {
  const s = signed ? (n >= 0 ? '+' : '−') : n < 0 ? '−' : ''
  return s + Math.abs(n) + '%'
}

/** "2026-11-20" → "20 Nov 2026" */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`
}

/** "2026-06" → "Jun 2026" (or "June 2026" with long = true) */
export function fmtMonth(ym: string, long = false): string {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  return `${(long ? MONTHS_LONG : MONTHS_SHORT)[m - 1]} ${y}`
}

/** "2026-06" → "Jun" */
export function monthShort(ym: string): string {
  const m = Number(ym.split('-')[1])
  return MONTHS_SHORT[m - 1] ?? ym
}

/** ["a","b","c"] → "a, b and c" */
export function listJoin(items: string[]): string {
  if (items.length < 2) return items.join('')
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1]
}

export function daysBetween(fromIso: string, to: Date = new Date()): number {
  const from = new Date(fromIso + 'T00:00:00')
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000)
}

export function isExternalUrl(url: string): boolean {
  return /^https?:\/\//.test(url)
}

export const ICON = {
  up: 'M10 16V4M5 9l5-5 5 5',
  down: 'M10 4v12M5 11l5 5 5-5',
  flat: 'M3 10h14M12 5l5 5-5 5',
  arrow: 'M4 10h12M11 5l5 5-5 5',
  chevronDown: 'M5 8l5 5 5-5',
  close: 'M5 5l10 10M15 5L5 15',
  external: 'M8 4H4v12h12v-4M11 3h6v6M17 3l-8 8',
  check: 'M4 10l4 4 8-8',
  warn: 'M10 2.5 18 17H2zM10 8v4M10 14v1',
  error: 'M2.5 2.5h15v15h-15zM7 7l6 6M13 7l-6 6',
  empty: 'M3 3h14v14H3zM7 10h6',
  replay: 'M4 10a6 6 0 1 0 2-4.5M4 3v4h4',
  mail: 'M3 5h14v10H3zM3 5l7 6 7-6',
  bell: 'M5 14V9a5 5 0 0 1 10 0v5l1.5 2h-13zM8 18h4',
  menu: 'M3 5h14M3 10h14M3 15h14',
  collapse: 'M12 5l-5 5 5 5',
  expand: 'M8 5l5 5-5 5',
} as const
