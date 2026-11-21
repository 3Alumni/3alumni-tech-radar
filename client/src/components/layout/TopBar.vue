<script setup lang="ts">
import { ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { ICON } from '@/lib/format'
import { useSnapshot } from '@/composables/useSnapshot'
import { useSidebar } from '@/composables/useSidebar'
import { useView } from '@/composables/useView'

const { newPolicyCount } = useSnapshot()
const { drawerOpen, openDrawer } = useSidebar()
const { go } = useView()
const menuBtn = ref<HTMLButtonElement | null>(null)
defineExpose({ focusMenu: () => menuBtn.value?.focus() })
</script>

<template>
  <header class="topbar">
    <button
      ref="menuBtn"
      type="button"
      class="btn btn-secondary menu-btn"
      :aria-expanded="drawerOpen"
      aria-controls="side"
      @click="openDrawer"
    >
      <Icon :path="ICON.menu" />Menu
    </button>
    <p class="topbar-title">Market Radar</p>
    <div class="topbar-end">
      <button
        type="button"
        class="icon-btn has-tip"
        :aria-label="`Policy and people: ${newPolicyCount} new items`"
        @click="go('policy')"
      >
        <Icon :path="ICON.bell" />
        <span v-if="newPolicyCount" class="badge" aria-hidden="true">{{ newPolicyCount }}</span>
        <span class="tip tip-b tip-r" aria-hidden="true">{{ newPolicyCount }} new policy items</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky; top: 0; z-index: 30;
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: var(--space-3);
  min-height: var(--header-h); padding: 0 var(--space-6);
  background: var(--color-surface); border-bottom: var(--border) solid var(--color-border);
}
.menu-btn { grid-column: 1; justify-self: start; display: none; }
.topbar-title { grid-column: 2; font-size: 18px; line-height: 24px; font-weight: 700; text-align: center; white-space: nowrap; }
.topbar-end { grid-column: 3; justify-self: end; display: flex; align-items: center; gap: var(--space-3); }
.badge {
  position: absolute; top: -10px; right: -10px; min-width: 22px; height: 22px; padding: 0 5px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--color-action); color: var(--color-on-action); font-size: 14px; line-height: 1; font-weight: 700;
}
@media (max-width: 1023px) {
  .topbar { padding: 0 var(--space-5); }
  .menu-btn { display: inline-flex; }
}
@media (max-width: 639px) {
  .topbar { padding: 0 var(--space-3); }
}
</style>
