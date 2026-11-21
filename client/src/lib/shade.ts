import { scaleQuantize } from 'd3'

/**
 * Shading level 1–4 for a value, relative to the top value of its chart. Maps to the red tokens
 * (--color-red-1…4; bar classes .shade-1…4 in base.css), so the map, canton bars, skill bars and
 * role ranking share one colour logic.
 * Small tops (≤ 4, e.g. canton counts): one step per count, darkest = top. Otherwise 4 equal ranges.
 */
export function shadeLevel(top: number): (v: number) => number {
  if (top <= 4) {
    const offset = 4 - top
    return (v) => Math.min(4, Math.max(1, Math.round(v) + offset))
  }
  const q = scaleQuantize<number>().domain([0, top]).range([1, 2, 3, 4])
  return (v) => q(v)
}
