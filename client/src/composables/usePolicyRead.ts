import { computed, ref } from 'vue'
import { usePolicyApi } from './usePolicyApi'

/**
 * Which new policy items this viewer has opened. Per-browser convenience only (localStorage):
 * nothing is sent anywhere, and it works without storage (everything just stays "unread").
 */
const KEY = 'market-radar:policy-read'
const read = ref<Set<string>>(new Set())

try {
  const raw = localStorage.getItem(KEY)
  if (raw) read.value = new Set(JSON.parse(raw) as string[])
} catch {
  /* storage unavailable */
}

export function usePolicyRead() {
  const { items, ensure } = usePolicyApi()
  void ensure()

  const isUnread = (p: { id: string; isNew: boolean }) => p.isNew && !read.value.has(p.id)
  /** New items this viewer has not opened yet, newest first. */
  const unreadItems = computed(() =>
    items.value.filter(isUnread).sort((x, y) => y.publishedDate.localeCompare(x.publishedDate)),
  )
  const unreadCount = computed(() => unreadItems.value.length)

  function markRead(id: string) {
    if (read.value.has(id)) return
    read.value = new Set([...read.value, id])
    try {
      localStorage.setItem(KEY, JSON.stringify([...read.value]))
    } catch {
      /* ignore */
    }
  }

  return { isUnread, unreadItems, unreadCount, markRead }
}
