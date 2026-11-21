import { ref, type Ref } from 'vue'

/**
 * Hover + keyboard exploration of chart points with one tab stop.
 * Focus the chart, then ← → / Home / End move the highlighted point; its tooltip opens on focus too.
 */
export function useActiveIndex(count: Ref<number>) {
  const active = ref<number | null>(null)
  const focused = ref(false)

  function onKey(e: KeyboardEvent) {
    const n = count.value
    if (!n) return
    const i = active.value ?? n - 1
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? Math.min(n - 1, i + 1)
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? Math.max(0, i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? n - 1
      : null
    if (next === null) return
    e.preventDefault()
    active.value = next
  }
  function onFocus() {
    focused.value = true
    if (active.value === null) active.value = count.value - 1
  }
  function onBlur() {
    focused.value = false
    active.value = null
  }
  function hover(i: number | null) {
    // A click focuses the chart. Pointer movement still picks the day under the cursor.
    // Leaving the chart keeps a keyboard selection, and clears a pointer selection.
    if (i === null && focused.value) return
    active.value = i
  }

  return { active, onKey, onFocus, onBlur, hover }
}
