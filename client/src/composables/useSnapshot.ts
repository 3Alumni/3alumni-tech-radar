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
    const checked = validateSnapshot(await res.json())
    if (!checked.ok) throw new Error(checked.error)
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

export function useSnapshot() {
  if (!started) {
    started = true
    void load()
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
