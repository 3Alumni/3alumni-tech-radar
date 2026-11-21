import { ref } from 'vue'

/** Desktop: collapsed (72 px) or expanded (264 px). Below 1024 px: off-canvas drawer. */

const collapsed = ref(false)
const drawerOpen = ref(false)

try {
  collapsed.value = localStorage.getItem('market-radar:side-collapsed') === '1'
} catch {
  /* per-viewer convenience only */
}

export function useSidebar() {
  function toggleCollapsed() {
    collapsed.value = !collapsed.value
    try {
      localStorage.setItem('market-radar:side-collapsed', collapsed.value ? '1' : '0')
    } catch {
      /* ignore */
    }
  }
  function openDrawer() {
    drawerOpen.value = true
  }
  function closeDrawer() {
    drawerOpen.value = false
  }
  return { collapsed, drawerOpen, toggleCollapsed, openDrawer, closeDrawer }
}
