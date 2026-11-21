import { computed, ref } from 'vue'

/** Tab navigation without a router: the current view lives in the URL hash (#demand). */

export type ViewId = 'overview' | 'demand' | 'skills' | 'employers' | 'policy' | 'sources' | 'subscribe'

export interface NavItem { id: ViewId; label: string; icon: string }

export const NAV_MAIN: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'M3 9l7-6 7 6v8h-5v-5H8v5H3z' },
  { id: 'demand', label: 'Demand', icon: 'M3 17h14M5 17V10M10 17V4M15 17v-7' },
  { id: 'skills', label: 'Skills', icon: 'M10 5C8 3.5 5 3.5 3 4v12c2-.5 5-.5 7 1 2-1.5 5-1.5 7-1V4c-2-.5-5-.5-7 1zM10 5v12' },
  { id: 'employers', label: 'Employers', icon: 'M4 17V3h8v14M12 8h4v9M2 17h16M7 6h2M7 9h2M7 12h2' },
  { id: 'policy', label: 'Policy and people', icon: 'M5 2h7l4 4v12H5zM12 2v4h4M8 10h5M8 13h5' },
]
export const NAV_GENERAL: NavItem[] = [
  { id: 'sources', label: 'Sources', icon: 'M4 5c0-1.5 12-1.5 12 0v10c0 1.5-12 1.5-12 0zM4 5c0 1.5 12 1.5 12 0M4 10c0 1.5 12 1.5 12 0' },
]

const VIEW_IDS: ViewId[] = ['overview', 'demand', 'skills', 'employers', 'policy', 'sources', 'subscribe']
const TITLES: Record<ViewId, string> = {
  overview: 'Overview', demand: 'Demand', skills: 'Skills', employers: 'Employers',
  policy: 'Policy and people', sources: 'Sources', subscribe: 'Get email summary',
}

function fromHash(): ViewId {
  const h = window.location.hash.replace('#', '') as ViewId
  return VIEW_IDS.includes(h) ? h : 'overview'
}

const current = ref<ViewId>(fromHash())
let listening = false

function sync() {
  current.value = fromHash()
  document.title = `${TITLES[current.value]} · Market Radar`
}

export function useView() {
  if (!listening) {
    listening = true
    window.addEventListener('hashchange', sync)
    sync()
  }

  function go(id: ViewId) {
    if (current.value === id) {
      focusContent()
      return
    }
    window.location.hash = id
    window.scrollTo(0, 0)
    // Move focus to the new view heading so keyboard and screen-reader users land in the content.
    requestAnimationFrame(focusContent)
  }

  return { current: computed(() => current.value), go }
}

function focusContent() {
  const h = document.querySelector<HTMLElement>('#content h1')
  if (h) {
    h.setAttribute('tabindex', '-1')
    h.focus({ preventScroll: true })
  }
}
