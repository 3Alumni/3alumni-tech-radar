<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { ICON, fmtDate } from '@/lib/format'
import { NAV_GENERAL, NAV_MAIN, useView, type NavItem } from '@/composables/useView'
import { useSidebar } from '@/composables/useSidebar'
import { useSnapshot } from '@/composables/useSnapshot'

const emit = defineEmits<{ closed: [] }>()
const { current, go } = useView()
const { collapsed, drawerOpen, toggleCollapsed, closeDrawer } = useSidebar()
const { newPolicyCount, snapshot, isSample } = useSnapshot()
const closeBtn = ref<HTMLButtonElement | null>(null)

const groups: { title: string; items: NavItem[] }[] = [
  { title: 'Menu', items: NAV_MAIN },
  { title: 'General', items: NAV_GENERAL },
]

function pick(id: NavItem['id']) {
  closeDrawer()
  go(id) // focus moves to the new view's heading
}

function close() {
  closeDrawer()
  emit('closed')
}

watch(drawerOpen, async (open) => {
  if (open) {
    await nextTick()
    closeBtn.value?.focus()
  }
})
</script>

<template>
  <div v-if="drawerOpen" class="side-backdrop" aria-hidden="true" @click="close" />
  <aside
    id="side"
    :class="['side', { collapsed: collapsed && !drawerOpen, open: drawerOpen }]"
    aria-label="Main"
    @keydown.esc="drawerOpen && close()"
  >
    <div class="side-in">
      <div class="side-brand">
        <button type="button" class="side-logo" aria-label="Market Radar by Powercoders: go to Overview" @click="pick('overview')">
          <img src="/powercoders.svg" alt="" width="150" height="18" />
        </button>
        <button
          type="button"
          class="side-toggle"
          :aria-label="collapsed ? 'Expand menu' : 'Collapse menu'"
          :aria-expanded="!collapsed"
          @click="toggleCollapsed"
        >
          <Icon :path="collapsed ? ICON.expand : ICON.collapse" />
        </button>
        <button ref="closeBtn" type="button" class="side-close" aria-label="Close menu" @click="close">
          <Icon :path="ICON.close" />
        </button>
      </div>

      <nav aria-label="Sections">
        <template v-for="g in groups" :key="g.title">
          <p class="side-group side-label">{{ g.title }}</p>
          <ul class="side-list">
            <li v-for="n in g.items" :key="n.id">
              <button
                type="button"
                class="side-link has-tip"
                :aria-current="current === n.id ? 'page' : undefined"
                @click="pick(n.id)"
              >
                <Icon :path="n.icon" />
                <span class="side-label">{{ n.label }}</span>
                <span v-if="n.id === 'policy' && newPolicyCount" class="side-badge">
                  <span aria-hidden="true">{{ newPolicyCount }}</span><span class="sr">, {{ newPolicyCount }} new</span>
                </span>
                <span class="tip tip-side" aria-hidden="true">{{ n.label }}</span>
              </button>
            </li>
          </ul>
        </template>
      </nav>

      <div class="side-foot">
        <div class="side-label side-meta">
          <span v-if="isSample" class="tag tag-sample has-tip" tabindex="0">
            Sample data<span class="tip">Placeholder figures until the real data snapshot arrives</span>
          </span>
          <span v-if="snapshot" class="small muted">Data snapshot: {{ fmtDate(snapshot.snapshotDate) }}</span>
        </div>
        <button
          type="button"
          class="btn btn-primary side-cta has-tip"
          :aria-current="current === 'subscribe' ? 'page' : undefined"
          @click="pick('subscribe')"
        >
          <Icon :path="ICON.mail" />
          <span class="side-label">Get email summary</span>
          <span class="tip tip-side" aria-hidden="true">Get email summary</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.side {
  position: relative; width: var(--side-w); background: var(--color-surface);
  border-right: var(--border) solid var(--color-border); z-index: 20; transition: width .2s ease;
}
.side.collapsed { width: var(--side-w-collapsed); }
.side-in {
  position: sticky; top: calc(var(--header-h) + 1px);
  display: flex; flex-direction: column; gap: var(--space-2); padding: var(--space-3) 12px;
}
.side-brand { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-2); padding: var(--space-2) 0 var(--space-4) 12px; }
.side-logo { display: flex; background: transparent; border: 0; padding: 0; cursor: pointer; }
.side-logo img { width: 150px; height: auto; }
.side.collapsed .side-brand { justify-content: center; padding-left: 0; }
.side.collapsed .side-logo { display: none; }

.side-toggle, .side-close {
  width: 40px; height: 40px; flex: none; display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: var(--border) solid transparent; color: var(--color-text-muted); cursor: pointer;
}
.side-toggle:hover, .side-close:hover { background: var(--color-bg); color: var(--color-text); }
.side-close { display: none; }

.side-group {
  font-size: 14px; line-height: 20px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  color: var(--color-text-muted); padding: var(--space-3) 12px var(--space-2);
}
.side-list { display: flex; flex-direction: column; gap: var(--space-1); }
.side-link {
  position: relative; width: 100%; display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 0 12px;
  border: 0; background: transparent; font-weight: 600; color: var(--color-text-muted); text-align: left; cursor: pointer;
  transition: background-color .12s, color .12s;
}
.side-link:hover { background: var(--color-bg); color: var(--color-text); }
.side-link[aria-current="page"] { background: var(--color-action-subtle); color: var(--color-action-strong); }
.side-badge {
  margin-left: auto; min-width: 22px; height: 22px; padding: 0 6px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--color-action); color: var(--color-on-action); font-size: 14px; line-height: 1; font-weight: 700;
}

.side-foot { margin-top: var(--space-4); display: flex; flex-direction: column; gap: 12px; padding-top: var(--space-3); border-top: var(--border) solid var(--color-border); }
.side-meta { display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-2); }
.side-cta { position: relative; width: 100%; justify-content: center; }

/* Collapsed rail: icons only, labels stay for screen readers, tooltips on the right */
.side.collapsed .side-link { justify-content: center; padding: 0; }
.side.collapsed .side-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.side.collapsed .side-group { padding: var(--space-2) 0 0; }
.side.collapsed .side-badge { position: absolute; top: 4px; right: 6px; min-width: 18px; height: 18px; padding: 0 4px; font-size: 12px; }
.side.collapsed .side-cta { padding: 0; }
.tip-side { bottom: auto; top: 50%; left: calc(100% + 12px); transform: translateY(-50%); display: none; }
.tip-side::after { top: 50%; left: auto; right: 100%; margin: -5px 0 0; border-top-color: transparent; border-right-color: var(--color-text); }
.side.collapsed .tip-side { display: block; }

/* Tablet and mobile: off-canvas drawer */
@media (max-width: 1023px) {
  .side { display: none; }
  .side.open {
    display: block; position: fixed; top: 0; left: 0; bottom: 0; width: 280px; z-index: 50; overflow: auto;
  }
  .side.open .side-in { position: static; }
  .side.open .side-toggle { display: none; }
  .side.open .side-close { display: inline-flex; }
  .side-backdrop { position: fixed; inset: 0; z-index: 45; background: var(--color-overlay); }
}
@media (min-width: 1024px) {
  .side-backdrop { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .side { transition: none; }
}
</style>
