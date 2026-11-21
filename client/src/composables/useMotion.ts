import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { easeCubicOut, interpolateNumber, timer, type Timer } from 'd3'

/** True when the viewer asked the OS for reduced motion. Live: follows changes while the page is open. */
export function useReducedMotion() {
  const reduced = ref(false)
  let mq: MediaQueryList | null = null
  const update = () => (reduced.value = !!mq?.matches)
  onMounted(() => {
    mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    update()
    mq.addEventListener('change', update)
  })
  onBeforeUnmount(() => mq?.removeEventListener('change', update))
  return reduced
}

/** Width of an element, kept current with ResizeObserver. */
export function useElementWidth(el: Ref<HTMLElement | null>) {
  const width = ref(0)
  let ro: ResizeObserver | null = null
  onMounted(() => {
    if (!el.value) return
    width.value = el.value.clientWidth
    ro = new ResizeObserver(([entry]) => {
      if (entry) width.value = entry.contentRect.width
    })
    ro.observe(el.value)
  })
  onBeforeUnmount(() => ro?.disconnect())
  return width
}

/**
 * Count up to a number once, the first time it changes from nothing to a value.
 * Later changes (e.g. switching role) jump straight to the new value. No animation with reduced motion.
 */
export function useCountUp(target: Ref<number>, duration = 800) {
  const shown = ref(0)
  const reduced = useReducedMotion()
  let done = false
  let t: Timer | null = null

  const run = (to: number) => {
    t?.stop()
    if (!to || done || reduced.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown.value = to
      return
    }
    done = true
    const i = interpolateNumber(0, to)
    t = timer((elapsed) => {
      const k = Math.min(1, elapsed / duration)
      shown.value = Math.round(i(easeCubicOut(k)))
      if (k >= 1) t?.stop()
    })
  }

  onMounted(() => run(target.value))
  watch(target, (v) => run(v))
  onBeforeUnmount(() => t?.stop())
  return shown
}
