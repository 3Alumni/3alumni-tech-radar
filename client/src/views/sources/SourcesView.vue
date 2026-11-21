<script setup lang="ts">
import Icon from '@/components/ui/Icon.vue'
import DataAlerts from '@/components/ui/DataAlerts.vue'
import CardState from '@/components/ui/CardState.vue'
import { ICON, fmtDate, isExternalUrl } from '@/lib/format'
import { useSnapshot } from '@/composables/useSnapshot'

const { snapshot, isSample } = useSnapshot()
</script>

<template>
  <section class="view" aria-labelledby="src-h">
    <div class="card-head">
      <h1 id="src-h" class="h1">Sources</h1>
      <p class="muted">Where every number comes from.</p>
    </div>
    <DataAlerts />

    <CardState :empty="!snapshot?.sources.length">
      <template #empty><b>No sources listed yet.</b></template>
      <table class="tbl cardify">
        <caption class="sr">Data sources used in Market Radar</caption>
        <thead>
          <tr>
            <th scope="col">Source</th>
            <th scope="col">Type</th>
            <th scope="col">What for</th>
            <th scope="col">Used in</th>
            <th scope="col">Updated</th>
            <th scope="col">Terms</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in snapshot?.sources ?? []" :key="s.name">
            <td data-label="Source">
              <a v-if="isExternalUrl(s.url)" class="ext" :href="s.url" target="_blank" rel="noopener noreferrer">
                <b>{{ s.name }}</b><span class="sr"> (opens in a new tab)</span><Icon :path="ICON.external" small />
              </a>
              <b v-else>{{ s.name }}</b>
            </td>
            <td data-label="Type">{{ s.type }}</td>
            <td data-label="What for">{{ s.purpose }}</td>
            <td data-label="Used in">{{ s.usedIn.join(', ') }}</td>
            <td data-label="Updated" class="num">{{ fmtDate(s.lastUpdate) }}</td>
            <td data-label="Terms">{{ s.attribution || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </CardState>

    <ul class="rules">
      <li><Icon :path="ICON.check" small />Totals only, no data about individuals</li>
      <li><Icon :path="ICON.check" small />Official APIs and open data only, no scraping</li>
    </ul>
    <details class="how">
      <summary>How to add a new source</summary>
      <ol>
        <li>Check the terms: official API, open data or a published report.</li>
        <li>Add one short entry to the sources list: name, link, which section it feeds, credit line.</li>
        <li>It appears here after the next data update.</li>
      </ol>
    </details>
    <p class="small muted">
      <template v-if="snapshot">Data snapshot: {{ fmtDate(snapshot.snapshotDate) }} · </template>
      <template v-if="isSample">Sample data · </template>Jobs by Adzuna · Map: BFS, GEOSTAT ·
      <a href="https://powercoders.org" target="_blank" rel="noopener noreferrer">powercoders.org</a>
    </p>
  </section>
</template>

<style scoped>
.view { gap: var(--space-4); }
.rules { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-4); }
.rules li { display: flex; align-items: center; gap: var(--space-2); }
.rules .ico { color: var(--color-success); }
.how { background: var(--color-surface); border: var(--border) solid var(--color-border); padding: 0 var(--space-3); transition: border-color .12s; }
.how:hover { border-color: var(--color-border-strong); }
.how summary { min-height: 48px; display: flex; align-items: center; gap: var(--space-2); font-weight: 600; cursor: pointer; color: var(--color-action); }
.how summary:hover { color: var(--color-action-strong); }
.how ol { list-style: decimal; padding: 0 0 var(--space-3) 20px; display: flex; flex-direction: column; gap: 6px; }
</style>
