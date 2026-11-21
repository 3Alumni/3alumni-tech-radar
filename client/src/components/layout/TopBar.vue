<script setup lang="ts">
import { ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { ICON } from '@/lib/format'
import NotificationsPanel from './NotificationsPanel.vue'
import { useSidebar } from '@/composables/useSidebar'
import { useView } from '@/composables/useView'

const { drawerOpen, openDrawer } = useSidebar()
const { current, go } = useView()
const menuBtn = ref<HTMLButtonElement | null>(null)
defineExpose({ focusMenu: () => menuBtn.value?.focus() })
</script>

<template>
  <header class="topbar">
    <div class="topbar-start">
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
    <button type="button" class="logo" aria-label="Market Radar by Powercoders: go to Overview" @click="go('overview')">
      <img src="/powercoders.svg" alt="" width="168" height="20" />
    </button>
    </div>
    <p class="topbar-title">Market Radar</p>
    <div class="topbar-end">
      <button
        type="button"
        class="btn btn-primary mail-btn"
        :aria-current="current === 'subscribe' ? 'page' : undefined"
        @click="go('subscribe')"
      >
        <Icon :path="ICON.mail" /><span class="mail-text">Get email summary</span>
      </button>
      <NotificationsPanel />
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
.topbar-start { grid-column: 1; justify-self: start; display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
.menu-btn { display: none; }
.logo { display: flex; flex: none; background: transparent; border: 0; padding: 4px 0; cursor: pointer; }
.logo img { width: 168px; height: auto; }
.topbar-title { grid-column: 2; font-size: 18px; line-height: 24px; font-weight: 700; text-align: center; white-space: nowrap; }
.topbar-end { grid-column: 3; justify-self: end; display: flex; align-items: center; gap: var(--space-3); }
@media (max-width: 1023px) {
  .topbar { padding: 0 var(--space-5); grid-template-columns: 1fr auto; }
  .menu-btn { display: inline-flex; }
  .topbar-title { display: none; }
  .topbar-end { grid-column: 2; }
}
.mail-btn[aria-current="page"] { background: var(--color-action-strong); border-color: var(--color-action-strong); }
@media (max-width: 639px) {
  .topbar { padding: 0 var(--space-3); }
  .topbar-end { gap: 12px; }
  /* Icon-only on phones; the text stays for screen readers */
  .mail-btn { width: var(--target-min); padding: 0; justify-content: center; }
  .mail-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .topbar-start { gap: 12px; }
  .logo img { width: 112px; }
}
</style>
