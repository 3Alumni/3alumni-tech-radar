import { computed, reactive, toRefs } from 'vue'
import { useSnapshot } from './useSnapshot'
import type { Role } from '@/lib/types'

/** Shared filters. Role and region apply to Overview, Demand, Skills and Employers. */

const state = reactive({
  role: 'it',
  region: 'all',
  // Employers
  junior: false,
  partner: false,
  hideAgency: true,
})

export function useFilters() {
  const { roles } = useSnapshot()

  const currentRole = computed<Role | null>(
    () => roles.value.find((r) => r.id === state.role) ?? roles.value[0] ?? null,
  )
  const roleLabel = computed(() => currentRole.value?.label ?? '')

  /** Every canton that appears in any role, sorted A–Z for the Region select. */
  const regions = computed(() => {
    const set = new Set<string>()
    roles.value.forEach((r) => r.adsByCanton.forEach((c) => set.add(c.canton)))
    return [...set].sort((a, b) => a.localeCompare(b, 'de-CH'))
  })

  function setRole(id: string) {
    state.role = id
  }
  function setRegion(region: string) {
    state.region = region
  }
  function toggleRegion(canton: string) {
    state.region = state.region === canton ? 'all' : canton
  }
  function resetEmployerFilters() {
    state.junior = false
    state.partner = false
    state.hideAgency = true
    state.region = 'all'
  }

  return {
    ...toRefs(state),
    currentRole,
    roleLabel,
    regions,
    setRole,
    setRegion,
    toggleRegion,
    resetEmployerFilters,
  }
}
