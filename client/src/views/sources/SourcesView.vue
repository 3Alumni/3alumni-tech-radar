<script setup lang="ts">
import Icon from '@/components/ui/Icon.vue'
import DataAlerts from '@/components/ui/DataAlerts.vue'
import CardState from '@/components/ui/CardState.vue'
import { ICON, fmtDate, isExternalUrl } from '@/lib/format'
import { useSnapshot } from '@/composables/useSnapshot'

const { snapshot } = useSnapshot()
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
            <th scope="col">What for</th>
            <th scope="col">Used in</th>
            <th scope="col">Updated</th>
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
            <td data-label="What for">{{ s.purpose }}</td>
            <td data-label="Used in">{{ s.usedIn.join(', ') }}</td>
            <td data-label="Updated" class="num">{{ fmtDate(s.lastUpdate) }}</td>
          </tr>
        </tbody>
      </table>
    </CardState>

    <p class="rule"><Icon :path="ICON.check" small />Official APIs and open data only</p>
  </section>
</template>

<style scoped>
.view { gap: var(--space-4); }
.rule { display: flex; align-items: center; gap: var(--space-2); }
.rule .ico { color: var(--color-success); }
</style>
