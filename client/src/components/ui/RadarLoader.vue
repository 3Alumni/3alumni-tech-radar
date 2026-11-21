<script setup lang="ts">
/**
 * Radar loader shown while a tab opens. Rebuilt from the "Radar loader · tab switch" design reference:
 * rings + crosshair, a red sweep rotating every 1.4 s, three blips fading in turn.
 * Reduced motion: static sweep, blips visible.
 */
defineProps<{ label: string }>()
</script>

<template>
  <div class="loader" role="status" aria-live="polite">
    <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <circle class="disc" cx="100" cy="100" r="96" />
      <circle class="ring" cx="100" cy="100" r="72" />
      <circle class="ring" cx="100" cy="100" r="48" />
      <circle class="ring" cx="100" cy="100" r="24" />
      <path class="ring" d="M100 4V196M4 100H196" />
      <path class="ticks" d="M100 0v8M100 192v8M0 100h8M192 100h8" />
      <g class="sweep">
        <path class="wedge" d="M100 100 L100 4 A96 96 0 0 1 183.1 52 Z" />
        <path class="beam" d="M100 100 L183.1 52" />
      </g>
      <circle class="blip b1" cx="132" cy="44" r="6" />
      <circle class="blip b2" cx="58" cy="66" r="5" />
      <circle class="blip b3" cx="140" cy="138" r="4" />
      <circle class="hub" cx="100" cy="100" r="4" />
    </svg>
    <p class="text">Loading {{ label }}…</p>
  </div>
</template>

<style scoped>
.loader {
  flex: 1; min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: var(--space-3); background: var(--color-bg);
}
svg { width: 240px; height: 240px; }
.disc { fill: var(--color-surface); stroke: var(--color-border-strong); stroke-width: 1.5; }
.ring { fill: none; stroke: var(--color-border); stroke-width: 1.5; }
.ticks { stroke: var(--color-border-strong); stroke-width: 3; }
.wedge { fill: var(--color-action); fill-opacity: .18; }
.beam { stroke: var(--color-action); stroke-width: 2.5; }
.blip, .hub { fill: var(--color-action); }
.text { font-size: 16px; line-height: 24px; font-weight: 600; color: var(--color-text-muted); }

.sweep { transform-box: view-box; transform-origin: 100px 100px; animation: mr-spin 1.4s linear infinite; }
.blip { opacity: 0; animation: mr-blip 1.4s ease-out infinite; }
.b2 { animation-delay: .45s; }
.b3 { animation-delay: .9s; }
@keyframes mr-spin { to { transform: rotate(360deg); } }
@keyframes mr-blip { 0% { opacity: 0; } 15% { opacity: 1; } 100% { opacity: 0; } }

@media (max-width: 639px) {
  svg { width: 180px; height: 180px; }
}
/* The global reduced-motion rule stops the animations; keep the blips visible so the radar still reads. */
@media (prefers-reduced-motion: reduce) {
  .blip { opacity: 1; }
}
</style>
