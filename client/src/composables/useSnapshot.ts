import { computed, readonly, shallowRef } from 'vue'
import type { Role, Snapshot } from '@/lib/types'
import { validateSnapshot } from '@/lib/validate'
import { daysBetween } from '@/lib/format'

/**
 * One composable loads and validates public/snapshot.json for the whole app.
 *
 * States: loading → ready | empty | error. "Outdated" is a flag on top of ready (snapshot > 30 days old).
 * On error we fall back to the last good snapshot kept in localStorage, if there is one.
 *
 * Demo: add ?state=loading|empty|outdated|error to the URL to preview each state in the pitch.
 * New data: the file is re-checked every 60 s and when the tab regains focus; changes appear without a reload.
 */

export type LoadStatus = 'loading' | 'ready' | 'empty' | 'error'
type DemoState = 'loading' | 'empty' | 'outdated' | 'error' | null

const CACHE_KEY = 'market-radar:last-snapshot'
const OUTDATED_AFTER_DAYS = 30

const status = shallowRef<LoadStatus>('loading')
const data = shallowRef<Snapshot | null>(null)
const errorMessage = shallowRef('')
const demo = shallowRef<DemoState>(null)
let started = false

function readDemoState(): DemoState {
  const v = new URLSearchParams(window.location.search).get('state')
  return v === 'loading' || v === 'empty' || v === 'outdated' || v === 'error' ? v : null
}

function readCache(): Snapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const res = validateSnapshot(JSON.parse(raw))
    return res.ok ? res.data : null
  } catch {
    return null
  }
}

function writeCache(s: Snapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(s))
  } catch {
    /* storage unavailable: fine, we just lose the offline fallback */
  }
}

function hasJobAds(s: Snapshot) {
  return s.roles.some((r) => r.adsByMonth.some((m) => m.count > 0))
}

async function load() {
  status.value = 'loading'
  demo.value = readDemoState()
  if (demo.value === 'loading') return

  try {
    const res = await fetch(`${import.meta.env.BASE_URL}snapshot.json`, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const raw = await res.text()
    const checked = validateSnapshot(JSON.parse(raw))
    if (!checked.ok) throw new Error(checked.error)
    lastRaw = raw
    writeCache(checked.data)
    data.value = checked.data
    if (demo.value === 'error') throw new Error('Demo error state')
    status.value = demo.value === 'empty' || !hasJobAds(checked.data) ? 'empty' : 'ready'
  } catch (e) {
    errorMessage.value = e instanceof Error ? e.message : String(e)
    data.value = data.value ?? readCache()
    status.value = 'error'
  }
}

/**
 * Background refresh: re-check snapshot.json without showing the loader.
 * Only swaps the data when the file actually changed, so nothing re-renders or re-animates for no reason.
 * A failed check keeps the current data (it is not an error the viewer needs to see).
 */
const REFRESH_MS = 60_000
let lastRaw = ''
async function refresh() {
  if (demo.value || document.visibilityState !== 'visible') return
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}snapshot.json`, { cache: 'no-cache' })
    if (!res.ok) return
    const raw = await res.text()
    if (raw === lastRaw) return
    const checked = validateSnapshot(JSON.parse(raw))
    if (!checked.ok) return
    lastRaw = raw
    writeCache(checked.data)
    data.value = checked.data
    status.value = hasJobAds(checked.data) ? 'ready' : 'empty'
  } catch {
    /* keep showing what we have */
  }
}

function startAutoRefresh() {
  window.setInterval(refresh, REFRESH_MS)
  document.addEventListener('visibilitychange', refresh) // coming back to the tab
  window.addEventListener('focus', refresh)
}

export function useSnapshot() {
  if (!started) {
    started = true
    void load()
    startAutoRefresh()
  }

  const snapshot = computed(() => data.value)
  const roles = computed<Role[]>(() => data.value?.roles ?? [])

  /** Charts render when there is data to show: ready, or error with a fallback snapshot. */
  const canShow = computed(() => (status.value === 'ready' || status.value === 'error') && data.value !== null)
  const isLoading = computed(() => status.value === 'loading')
  const isEmpty = computed(() => status.value === 'empty')
  const isError = computed(() => status.value === 'error')
  const isOutdated = computed(() => {
    if (!data.value) return false
    if (demo.value === 'outdated') return true
    return daysBetween(data.value.snapshotDate) > OUTDATED_AFTER_DAYS
  })
  const isSample = computed(() => /sample/i.test(data.value?._note ?? ''))
  const newPolicyCount = computed(() => data.value?.policy.filter((p) => p.isNew).length ?? 0)

  function sourceByName(name: string) {
    return data.value?.sources.find((s) => s.name === name) ?? null
  }

  return {
    status: readonly(status),
    errorMessage: readonly(errorMessage),
    snapshot,
    roles,
    canShow,
    isLoading,
    isEmpty,
    isError,
    isOutdated,
    isSample,
    newPolicyCount,
    sourceByName,
    reload: load,
  }
}
