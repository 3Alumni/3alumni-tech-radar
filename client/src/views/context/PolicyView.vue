<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import DataAlerts from '@/components/ui/DataAlerts.vue'
import CardState from '@/components/ui/CardState.vue'
import { ICON, fmtDate, isExternalUrl } from '@/lib/format'
import { useInsights, IMPACT_LABEL, POLICY_TYPE_LABEL } from '@/composables/useInsights'
import { useSnapshot } from '@/composables/useSnapshot'

const PAGE = 3
const { snapshot, newPolicyCount } = useSnapshot()
const { policySorted } = useInsights()
const showOlder = ref(false)
const items = computed(() => (showOlder.value ? policySorted.value : policySorted.value.slice(0, PAGE)))
</script>

<template>
  <section class="view" aria-labelledby="pol-h">
    <div class="card-head">
      <h1 id="pol-h" class="h1">Policy and people</h1>
      <p class="muted">New laws, motions and figures that affect our participants.</p>
    </div>
    <DataAlerts />

    <CardState :empty="!policySorted.length">
      <template #empty><b>No policy items yet.</b> Check again after the next data update.</template>
      <p v-if="snapshot?.previousSnapshotDate" class="new-bar">
        <span class="tag tag-new">{{ newPolicyCount }} new</span>
        <span>since {{ fmtDate(snapshot.previousSnapshotDate) }}</span>
      </p>
      <ol class="tl">
        <li v-for="p in items" :key="p.id" class="tl-item">
          <p class="small muted">
            <b class="date">{{ fmtDate(p.publishedDate) }}</b><br />{{ POLICY_TYPE_LABEL[p.type] }}
          </p>
          <div class="tl-body">
            <div class="tags">
              <span v-if="p.isNew" class="tag tag-new">New</span>
              <span :class="['tag', 'imp-' + p.impact]">{{ IMPACT_LABEL[p.impact] }}</span>
            </div>
            <h2 class="q">{{ p.title }}</h2>
            <p>{{ p.summary }}</p>
            <p class="small muted meta">
              <span class="has-tip ai" tabindex="0">Summary by AI<span class="tip">Check the original before acting on it</span></span>
              <span aria-hidden="true">·</span>
              <span>
                Source:
                <a v-if="isExternalUrl(p.sourceUrl)" :href="p.sourceUrl" target="_blank" rel="noopener noreferrer">{{ p.sourceName }}</a>
                <template v-else>{{ p.sourceName }}</template>
              </span>
              <span aria-hidden="true">·</span>
              <span>Downloaded {{ fmtDate(p.downloadedDate) }}</span>
            </p>
          </div>
        </li>
      </ol>
      <button
        v-if="policySorted.length > PAGE"
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
.new-bar { display: flex; align-items: center; gap: 12px; }
.tl { border-top: var(--border) solid var(--color-text); }
.tl-item {
  display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: var(--space-3);
  padding: 20px var(--space-3); margin: 0 calc(-1 * var(--space-3));
  border-bottom: var(--border) solid var(--color-border); transition: background-color .12s;
}
.tl-item:hover { background: var(--color-surface); }
.date { color: var(--color-text); }
.tl-body { display: flex; flex-direction: column; gap: var(--space-2); min-width: 0; }
.meta { display: flex; flex-wrap: wrap; gap: var(--space-1) var(--space-2); }
.ai { text-decoration: underline dotted; text-underline-offset: 3px; cursor: help; }
.more { align-self: flex-start; }
@media (max-width: 639px) {
  .tl-item { grid-template-columns: minmax(0, 1fr); gap: var(--space-1); }
}
</style>
