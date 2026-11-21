<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { ICON, fmtDate } from '@/lib/format'
import { usePolicyRead } from '@/composables/usePolicyRead'
import { useView } from '@/composables/useView'

/**
 * Bell + dropdown that lists only new, unread policy items (light red, like on the Policy page).
 * Opening an item marks it read and goes to Policy and people. Esc / outside click closes.
 */
const { unreadItems, unreadCount, markRead } = usePolicyRead()
const { go } = useView()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const bell = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)

function close(returnFocus = true) {
  open.value = false
  if (returnFocus) bell.value?.focus()
}
function toggle() {
  open.value = !open.value
}
function openItem(id: string) {
  markRead(id)
  close(false)
  go('policy')
}
function showAll() {
  close(false)
  go('policy')
}
function onOutside(e: PointerEvent) {
  if (root.value && !root.value.contains(e.target as Node)) close(false)
}
watch(open, async (v) => {
  if (v) {
    document.addEventListener('pointerdown', onOutside)
    await nextTick()
    panel.value?.querySelector<HTMLElement>('button')?.focus()
  } else {
    document.removeEventListener('pointerdown', onOutside)
  }
})
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))
</script>

<template>
  <div ref="root" class="notif" @keydown.esc="open && close()">
    <button
      ref="bell"
      type="button"
      :class="['icon-btn', 'has-tip', { on: open }]"
      :aria-label="`Notifications: ${unreadCount} new policy ${unreadCount === 1 ? 'item' : 'items'}`"
      :aria-expanded="open"
      aria-controls="notif-panel"
      @click="toggle"
    >
      <Icon :path="ICON.bell" />
      <span v-if="unreadCount" class="badge" aria-hidden="true">{{ unreadCount }}</span>
      <span v-if="!open" class="tip tip-b tip-r" aria-hidden="true">{{ unreadCount }} new policy {{ unreadCount === 1 ? 'item' : 'items' }}</span>
    </button>

    <Transition name="drop">
      <div v-if="open" id="notif-panel" ref="panel" class="panel" role="region" aria-label="New policy items">
        <p class="head">New policy items</p>
        <ul v-if="unreadItems.length" class="list">
          <li v-for="p in unreadItems" :key="p.id">
            <button type="button" class="item" @click="openItem(p.id)">
              <span class="date">{{ fmtDate(p.publishedDate) }}</span>
              <span class="title">{{ p.title }}</span>
              <span class="src">Source: {{ p.sourceName }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="empty">No new items. You are up to date.</p>
        <button type="button" class="btn btn-ghost all" @click="showAll">
          All policy items<Icon :path="ICON.arrow" small />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.notif { position: relative; }
.icon-btn.on { background: var(--color-bg); border-color: var(--color-text); }
.badge {
  position: absolute; top: -10px; right: -10px; min-width: 22px; height: 22px; padding: 0 5px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--color-action); color: var(--color-on-action); font-size: 14px; line-height: 1; font-weight: 700;
}
.panel {
  position: absolute; right: 0; top: calc(100% + 12px); z-index: 40; width: min(380px, calc(100vw - 32px));
  background: var(--color-surface); border: var(--border) solid var(--color-border-strong);
  display: flex; flex-direction: column;
}
.head {
  padding: 12px var(--space-3); border-bottom: var(--border) solid var(--color-border);
  font-size: 14px; line-height: 20px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--color-text-muted);
}
.list { display: flex; flex-direction: column; }
.list li + li { border-top: var(--border) solid var(--color-border); }
.item {
  width: 100%; display: flex; flex-direction: column; gap: 2px; padding: 12px var(--space-3);
  background: var(--color-action-subtle); box-shadow: inset 3px 0 0 var(--color-action);
  border: 0; text-align: left; color: var(--color-text); cursor: pointer; transition: box-shadow .12s;
}
.item:hover { box-shadow: inset 6px 0 0 var(--color-action); }
.item:focus-visible { outline-offset: -3px; }
.date { font-size: 14px; line-height: 20px; font-weight: 700; }
.title { font-weight: 600; }
.item:hover .title { text-decoration: underline; text-underline-offset: 3px; }
.src { font-size: 14px; line-height: 20px; color: var(--color-text-muted); }
.empty { padding: var(--space-3); color: var(--color-text-muted); }
.all { align-self: flex-start; margin: var(--space-2) var(--space-2); }

.drop-enter-active, .drop-leave-active { transition: opacity .14s ease, translate .14s var(--ease-out); }
.drop-enter-from, .drop-leave-to { opacity: 0; translate: 0 -4px; }
</style>
