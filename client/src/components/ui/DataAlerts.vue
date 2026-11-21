<script setup lang="ts">
import Icon from './Icon.vue'
import { ICON, fmtDate } from '@/lib/format'
import { useSnapshot } from '@/composables/useSnapshot'

const { isOutdated, isError, snapshot, reload } = useSnapshot()
</script>

<template>
  <p v-if="isError" class="alert al-err" role="alert">
    <Icon :path="ICON.error" />
    <span v-if="snapshot">
      <b>Could not load the latest data.</b> Showing the last saved snapshot from {{ fmtDate(snapshot.snapshotDate) }}.
    </span>
    <span v-else><b>Could not load the data.</b> Please try again in a moment.</span>
    <button type="button" class="btn btn-ghost retry" @click="reload()">Try again</button>
  </p>
  <p v-else-if="isOutdated && snapshot" class="alert al-warn" role="status">
    <Icon :path="ICON.warn" />
    <span><b>Outdated:</b> this data is older than 30 days ({{ fmtDate(snapshot.snapshotDate) }}).</span>
  </p>
</template>

<style scoped>
.alert { display: flex; gap: 10px; align-items: flex-start; flex-wrap: wrap; padding: 12px 16px; border: var(--border) solid; font-size: 14px; line-height: 20px; }
.al-warn { background: var(--color-warning-subtle); border-color: var(--color-warning); }
.al-warn .ico { color: var(--color-warning); }
.al-err { background: var(--color-action-subtle); border-color: var(--color-action-strong); align-items: center; }
.al-err .ico { color: var(--color-action-strong); }
.al-err span { flex: 1 1 240px; }
.retry { margin: -10px -8px -10px auto; }
</style>
