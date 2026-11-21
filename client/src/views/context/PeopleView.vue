<script setup lang="ts">
import DataAlerts from '@/components/ui/DataAlerts.vue'
import { fmtDate, fmtMonth, fmtNum, isExternalUrl } from '@/lib/format'
import { usePeopleApi } from '@/composables/usePeopleApi'

const { groups, loading, error } = usePeopleApi()

function periodLabel(period?: string) {
  if (!period) return ''
  return /^\d{4}-\d{2}$/.test(period) ? fmtMonth(period) : period
}
</script>

<template>
  <section class="view" aria-labelledby="ppl-h">
    <div class="card-head">
      <h1 id="ppl-h" class="h1">People</h1>
      <p class="muted">Residence status, asylum and foreign residents. Aggregates only.</p>
    </div>
    <DataAlerts />

    <p v-if="error" class="small" role="alert">{{ error }}</p>
    <p v-else-if="loading" class="small muted">Loading people…</p>
    <div v-else class="groups">
      <section v-for="group in groups" :key="group.title" class="group">
        <h2 class="q">{{ group.title }}</h2>
        <div class="tiles">
          <article v-for="card in group.cards" :key="card.label" class="tile">
            <span class="small muted">{{ card.label }}</span>
            <span class="tile-v">{{ fmtNum(card.value) }}</span>
            <span v-if="card.period" class="small muted">{{ periodLabel(card.period) }}</span>
          </article>
        </div>
        <ul v-if="group.rows.length" class="rows">
          <li v-for="row in group.rows" :key="row.label">
            <span>{{ row.label }}</span>
            <b class="num">{{ fmtNum(row.value) }}</b>
          </li>
        </ul>
        <p v-if="group.sourceUrl" class="small muted">
          Source:
          <a v-if="isExternalUrl(group.sourceUrl)" :href="group.sourceUrl" target="_blank" rel="noopener noreferrer">State Secretariat for Migration</a>
          <template v-else>State Secretariat for Migration</template>
          <template v-if="group.fetchedAt"> · {{ fmtDate(group.fetchedAt) }}</template>
        </p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.view { gap: var(--space-4); }
.groups { display: flex; flex-direction: column; gap: var(--space-4); }
.group { display: flex; flex-direction: column; gap: var(--space-2); }
.tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-3); }
.tile {
  display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-1); padding: 16px;
  background: var(--color-surface); border: var(--border) solid var(--color-border);
}
.tile-v { font-size: 28px; line-height: 36px; font-weight: 700; font-variant-numeric: tabular-nums; }
.rows { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0 var(--space-4); margin: 0; padding: 0; list-style: none; }
.rows li { display: flex; justify-content: space-between; gap: var(--space-2); padding: 6px 0; border-bottom: var(--border) solid var(--color-border); }
.num { font-variant-numeric: tabular-nums; }
</style>
