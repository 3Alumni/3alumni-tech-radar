<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, watch, type Component } from 'vue'
import TopBar from '@/components/layout/TopBar.vue'
import SideNav from '@/components/layout/SideNav.vue'
import SalaryDialog from '@/components/SalaryDialog.vue'
import RadarLoader from '@/components/ui/RadarLoader.vue'
import OverviewView from '@/views/overview/OverviewView.vue'
import { focusContent, useView, type ViewId } from '@/composables/useView'
import { useSidebar } from '@/composables/useSidebar'
import { useSnapshot } from '@/composables/useSnapshot'
import { usePeopleApi } from '@/composables/usePeopleApi'
import { usePolicyApi } from '@/composables/usePolicyApi'

useSnapshot() // start loading the data as early as possible
void usePeopleApi().ensure()
void usePolicyApi().ensure()
const { current } = useView()
const { drawerOpen } = useSidebar()
const topbar = ref<InstanceType<typeof TopBar> | null>(null)

// Each tab's code is split into its own chunk; the radar loader covers fetching it.
const IMPORTS: Partial<Record<ViewId, () => Promise<unknown>>> = {
  demand: () => import('@/views/demand/DemandView.vue'),
  skills: () => import('@/views/skills/SkillsView.vue'),
  employers: () => import('@/views/employers/EmployersView.vue'),
  people: () => import('@/views/context/PeopleView.vue'),
  policy: () => import('@/views/context/PolicyView.vue'),
  sources: () => import('@/views/sources/SourcesView.vue'),
  subscribe: () => import('@/views/subscribe/SubscribeView.vue'),
}
const VIEWS = Object.fromEntries(
  Object.entries(IMPORTS).map(([id, load]) => [id, defineAsyncComponent(load as () => Promise<Component>)]),
) as Record<ViewId, Component>
VIEWS.overview = OverviewView
const view = computed(() => VIEWS[current.value])

const LOADER_LABEL: Record<ViewId, string> = {
  overview: 'overview', demand: 'demand', skills: 'skills', employers: 'employers',
  people: 'people', policy: 'new policies', sources: 'sources', subscribe: 'email summary',
}
const LOADER_MS = 700
const LOADER_MS_REDUCED = 300

/** Radar loader on every tab switch (not on first page load). Shows for a short minimum time. */
const switching = ref(false)
let ticket = 0
watch(current, async (id) => {
  const mine = ++ticket
  switching.value = true
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  await Promise.all([
    IMPORTS[id]?.().catch(() => undefined), // a failed chunk shows Vue's error path, not a stuck loader
    new Promise((r) => setTimeout(r, reduced ? LOADER_MS_REDUCED : LOADER_MS)),
  ])
  if (mine !== ticket) return // user already clicked another tab
  switching.value = false
})

// The view enters after the loader fades out; only then does its heading exist to take focus.
function onEntered(el: Element) {
  if (!el.classList.contains('loader')) focusContent()
}

// Return focus to the Menu button once the top bar is no longer inert.
async function onDrawerClosed() {
  await nextTick()
  topbar.value?.focusMenu()
}
</script>

<template>
  <a class="skip" href="#content">Skip to content</a>
  <TopBar ref="topbar" :inert="drawerOpen || undefined" />
  <div class="shell">
    <SideNav @closed="onDrawerClosed" />
    <main id="content" class="content" tabindex="-1" :inert="drawerOpen || undefined">
      <Transition name="fade" mode="out-in" @after-enter="onEntered">
        <RadarLoader v-if="switching" key="loader" :label="LOADER_LABEL[current]" />
        <component :is="view" v-else :key="current" />
      </Transition>
    </main>
  </div>
  <SalaryDialog />
</template>

<style scoped>
.skip {
  position: absolute; left: -9999px; top: var(--space-2); z-index: 60;
  background: var(--color-surface); padding: 10px var(--space-3); border: 3px solid var(--color-text); font-weight: 600;
}
.skip:focus { left: var(--space-3); }
.shell { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: stretch; min-height: calc(100vh - var(--header-h)); }
.content { min-width: 0; padding: 40px var(--space-6) var(--space-7); display: flex; flex-direction: column; }
.content:focus { outline: none; }
.content > :deep(.view) { max-width: var(--content-max); }
:deep(h1[tabindex="-1"]:focus) { outline: none; }
.fade-enter-active, .fade-leave-active { transition: opacity .18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@media (max-width: 1023px) {
  .shell { grid-template-columns: minmax(0, 1fr); }
  .content { padding: var(--space-5); }
}
@media (max-width: 639px) {
  .content { padding: var(--space-4) var(--space-3) var(--space-6); }
}
</style>
