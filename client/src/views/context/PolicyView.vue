<script setup lang="ts">
import RadarLoader from '@/components/ui/RadarLoader.vue'
import { computed, onMounted, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import DataAlerts from '@/components/ui/DataAlerts.vue'
import CardState from '@/components/ui/CardState.vue'
import { ICON, fmtDate, isExternalUrl } from '@/lib/format'
import { parts } from '@/lib/links'
import { usePolicyApi } from '@/composables/usePolicyApi'
import { usePolicyRead } from '@/composables/usePolicyRead'

const PAGE = 3
const { items: policyItems, loading, error, ensure, summarize } = usePolicyApi()
const { isUnread, markRead } = usePolicyRead()
const showOlder = ref(false)
const items = computed(() => (showOlder.value ? policyItems.value : policyItems.value.slice(0, PAGE)))

onMounted(async () => {
  await ensure()
  summarize()
})
</script>

<template>
  <section class="view" aria-labelledby="pol-h">
    <div class="card-head">
      <h1 id="pol-h" class="h1">New policies</h1>
    </div>
    <DataAlerts />

    <p v-if="error" class="small" role="alert">{{ error }}</p>
    <CardState :empty="!loading && !policyItems.length">
      <template #empty><b>No policy items yet.</b> Check again after the next data update.</template>
      <RadarLoader v-if="loading" label="policies" />
      <ol v-else class="tl">
        <li v-for="p in items" :key="p.id" :class="['tl-item', { unread: isUnread(p) }]" @click="markRead(p.id)">
          <p class="small muted">
            <b class="date">{{ fmtDate(p.publishedDate) }}</b>
          </p>
          <div class="tl-body">
            <h3 class="q">
              <button type="button" class="tl-title" @click.stop="markRead(p.id)">
                <span v-if="isUnread(p)" class="sr">New, unread: </span>{{ p.title }}
              </button>
            </h3>
            <div v-if="p.keyChanges.length" class="points">
              <p class="small"><b>Key changes</b></p>
              <ul>
                <li v-for="point in p.keyChanges" :key="point" class="small">
                  <template v-for="(chunk, i) in parts(point)" :key="i">
                    <a v-if="chunk.href" :href="chunk.href" target="_blank" rel="noopener noreferrer" @click="markRead(p.id)">{{ chunk.text }}</a>
                    <template v-else>{{ chunk.text }}</template>
                  </template>
                </li>
              </ul>
            </div>
            <div v-if="p.keyUpdates.length" class="points">
              <p class="small"><b>Key updates</b></p>
              <ul>
                <li v-for="point in p.keyUpdates" :key="point" class="small">
                  <template v-for="(chunk, i) in parts(point)" :key="i">
                    <a v-if="chunk.href" :href="chunk.href" target="_blank" rel="noopener noreferrer" @click="markRead(p.id)">{{ chunk.text }}</a>
                    <template v-else>{{ chunk.text }}</template>
                  </template>
                </li>
              </ul>
            </div>
            <p class="small muted meta">
              <span>
                Source:
                <a v-if="isExternalUrl(p.sourceUrl)" :href="p.sourceUrl" target="_blank" rel="noopener noreferrer" @click="markRead(p.id)">{{ p.sourceName }}</a>
                <template v-else>{{ p.sourceName }}</template>
              </span>
            </p>
          </div>
        </li>
      </ol>
      <button
        v-if="policyItems.length > PAGE"
        type="button"
        class="btn btn-secondary more"
        :aria-expanded="showOlder"
        @click="showOlder = !showOlder"
      >
        <Icon :path="showOlder ? ICON.up : ICON.down" small />{{ showOlder ? 'Show only the newest' : 'Show older documents' }}
      </button>
    </CardState>
  </section>
</template>

<style scoped>
.view { gap: var(--space-4); }
/* The list bleeds 16px each side so the rows' backgrounds and the top rule share one full width. */
.tl { margin: 0 calc(-1 * var(--space-3)); border-top: var(--border) solid var(--color-border); }
.tl-item {
  display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: var(--space-3);
  padding: 20px var(--space-3);
  border-bottom: var(--border) solid var(--color-border); transition: background-color .12s;
}
.tl-item { cursor: pointer; }
.tl-item:hover { background: var(--color-surface); }
/* New and not opened yet: light red, with a red rail on the left edge */
.tl-item.unread { background: var(--color-action-subtle); box-shadow: inset 3px 0 0 var(--color-action); }
.tl-item.unread:hover { background: var(--color-action-subtle); }
.tl-title {
  padding: 0; border: 0; background: transparent; font: inherit; color: inherit; text-align: left; cursor: pointer;
}
.tl-title:hover { text-decoration: underline; text-underline-offset: 3px; }
.date { color: var(--color-text); }
.tl-body { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
.meta { display: flex; flex-wrap: wrap; gap: var(--space-1) var(--space-2); }
.more { align-self: flex-start; }
.points ul { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 4px; }
.points { display: flex; flex-direction: column; gap: 4px; }
@media (max-width: 639px) {
  .tl-item { grid-template-columns: minmax(0, 1fr); gap: var(--space-1); }
}
</style>
