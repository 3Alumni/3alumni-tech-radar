<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, ref, type Component } from 'vue'
import TopBar from '@/components/layout/TopBar.vue'
import SideNav from '@/components/layout/SideNav.vue'
import SalaryDialog from '@/components/SalaryDialog.vue'
import OverviewView from '@/views/overview/OverviewView.vue'
import { useView, type ViewId } from '@/composables/useView'
import { useSidebar } from '@/composables/useSidebar'
import { useSnapshot } from '@/composables/useSnapshot'

useSnapshot() // start loading the data as early as possible
const { current } = useView()
const { drawerOpen } = useSidebar()
const topbar = ref<InstanceType<typeof TopBar> | null>(null)

const VIEWS: Record<ViewId, Component> = {
  overview: OverviewView,
  demand: defineAsyncComponent(() => import('@/views/demand/DemandView.vue')),
  skills: defineAsyncComponent(() => import('@/views/skills/SkillsView.vue')),
  employers: defineAsyncComponent(() => import('@/views/employers/EmployersView.vue')),
  policy: defineAsyncComponent(() => import('@/views/context/PolicyView.vue')),
  sources: defineAsyncComponent(() => import('@/views/sources/SourcesView.vue')),
  subscribe: defineAsyncComponent(() => import('@/views/subscribe/SubscribeView.vue')),
}
const view = computed(() => VIEWS[current.value])

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
      <component :is="view" :key="current" />
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
@media (max-width: 1023px) {
  .shell { grid-template-columns: minmax(0, 1fr); }
  .content { padding: var(--space-5); }
}
@media (max-width: 639px) {
  .content { padding: var(--space-4) var(--space-3) var(--space-6); }
}
</style>
