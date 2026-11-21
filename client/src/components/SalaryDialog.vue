<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { max, mean, scaleLinear } from 'd3'
import Icon from '@/components/ui/Icon.vue'
import { ICON, fmtChf, fmtMonth, monthShort } from '@/lib/format'
import { useSnapshot } from '@/composables/useSnapshot'
import { useSalaryDialog } from '@/composables/useSalaryDialog'
import { useActiveIndex } from '@/composables/useActiveIndex'

/** Average advertised salary per role, last 12 months. Native <dialog>: focus trap + Esc for free. */
const { roles, isSample } = useSnapshot()
const { roleId, open, close } = useSalaryDialog()
const dlg = ref<HTMLDialogElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)

const role = computed(() => roles.value.find((r) => r.id === roleId.value) ?? null)
const series = computed(() => role.value?.avgSalaryByMonth ?? [])
const avg = computed(() => Math.round((mean(series.value, (m) => m.chf) ?? 0) / 100) * 100)
const first = computed(() => series.value[0])
const last = computed(() => series.value[series.value.length - 1])
const pct = computed(() => (first.value && last.value ? Math.round((last.value.chf / first.value.chf - 1) * 1000) / 10 : 0))
const y = computed(() => scaleLinear().domain([0, (max(series.value, (m) => m.chf) ?? 1) * 1.1]).range([0, 100]))
const aria = computed(() =>
  role.value && first.value && last.value
    ? `Average advertised salary for ${role.value.label} per month, ${fmtMonth(first.value.month, true)} to ${fmtMonth(last.value.month, true)}: from ${fmtChf(first.value.chf)} to ${fmtChf(last.value.chf)}, average ${fmtChf(avg.value)}`
    : '',
)
const count = computed(() => series.value.length)
const { active, onKey, onFocus, onBlur, hover } = useActiveIndex(count)
const tipCls = (i: number) => (i < 2 ? 'tip tip-l' : i > count.value - 3 ? 'tip tip-r' : 'tip')

watch(roleId, async (id) => {
  await nextTick()
  if (!dlg.value) return
  if (id && !dlg.value.open) {
    dlg.value.showModal()
    closeBtn.value?.focus()
  } else if (!id && dlg.value.open) {
    dlg.value.close()
  }
})

function onBackdrop(e: MouseEvent) {
  if (e.target === dlg.value) close()
}
</script>

<template>
  <dialog ref="dlg" class="dlg" aria-labelledby="sal-h" @close="close" @click="onBackdrop">
    <div v-if="role" class="dlg-in">
      <div class="dlg-head">
        <div class="card-head">
          <p class="label muted">Average salary</p>
          <h2 id="sal-h" class="h2">{{ role.label }}</h2>
        </div>
        <button ref="closeBtn" type="button" class="icon-btn" aria-label="Close" @click="close">
          <Icon :path="ICON.close" />
        </button>
      </div>
      <div class="seg" role="group" aria-label="Role">
        <button v-for="r in roles" :key="r.id" type="button" :aria-pressed="r.id === roleId" @click="open(r.id)">{{ r.label }}</button>
      </div>
      <div class="kpi">
        <span class="big">{{ fmtChf(avg) }}</span>
        <span class="muted small kpi-note">average per year, last 12 months</span>
        <span v-if="first" :class="[pct >= 0 ? 'up' : 'down', 'kpi-note', 'kpi-push']">
          <Icon :path="pct >= 0 ? ICON.up : ICON.down" small />{{ pct >= 0 ? '+' : '−' }}{{ Math.abs(pct) }}% since {{ fmtMonth(first.month) }}
        </span>
      </div>
      <div>
        <div
          class="cols"
          role="img"
          tabindex="0"
          :aria-label="aria + '. Use arrow keys to read each month.'"
          :style="{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }"
          @keydown="onKey"
          @focus="onFocus"
          @blur="onBlur"
          @mouseleave="hover(null)"
        >
          <div
            v-for="(m, i) in series"
            :key="m.month"
            :class="['col', { on: active === i }]"
            aria-hidden="true"
            @mouseenter="hover(i)"
          >
            <span :class="['col-val', { ends: i === 0 || i === count - 1 }]">{{ (m.chf / 1000).toFixed(1) }}k</span>
            <span :class="['col-bar', 'grow-y', { sel: i === count - 1 }]" :style="{ height: y(m.chf) + '%', '--i': i }" />
            <span :class="tipCls(i)"><b>{{ fmtChf(m.chf) }}</b> · {{ fmtMonth(m.month) }}</span>
          </div>
        </div>
        <div class="col-months" :style="{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }" aria-hidden="true">
          <span v-for="m in series" :key="m.month">{{ monthShort(m.month).charAt(0) }}</span>
        </div>
        <p class="sr" aria-live="polite">
          <template v-if="active !== null && series[active]">{{ fmtMonth(series[active].month, true) }}: {{ fmtChf(series[active].chf) }}</template>
        </p>
      </div>
      <p class="small muted">
        Average advertised salary in job ads, gross per year, all of Switzerland · k = CHF thousand<template v-if="isSample"> · Sample data</template>
      </p>
    </div>
  </dialog>
</template>

<style scoped>
.dlg {
  width: min(640px, calc(100% - 32px)); max-height: calc(100% - 32px); overflow: auto;
  background: var(--color-surface); color: var(--color-text); border: var(--border) solid var(--color-text); padding: 0;
}
.dlg::backdrop { background: var(--color-overlay); }
.dlg-in { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
.dlg-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-3); }
.cols { display: grid; gap: 6px; align-items: end; height: 180px; border-bottom: var(--border) solid var(--color-border); }
.col { position: relative; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: stretch; cursor: crosshair; transition: opacity .15s; }
.cols:hover .col { opacity: .45; }
.cols:hover .col:hover, .col.on { opacity: 1; }
.col-bar { display: block; width: 100%; background: var(--color-text-muted); transition: height .4s var(--ease-out), background-color .15s; }
.col:hover .col-bar:not(.sel), .col.on .col-bar:not(.sel) { background: var(--color-text); }
.col-bar.sel { background: var(--color-action); }
.col-val { font-size: 14px; line-height: 20px; font-weight: 600; text-align: center; white-space: nowrap; color: var(--color-text); font-variant-numeric: tabular-nums; margin-bottom: 4px; letter-spacing: -.02em; }
.cols { padding-top: 24px; height: 204px; }
.col .tip { bottom: auto; top: -8px; }
.col.on .tip { opacity: 1; visibility: visible; }
.col-months { display: grid; gap: 6px; text-align: center; font-size: 14px; line-height: 20px; color: var(--color-text-muted); margin-top: var(--space-1); }
@media (max-width: 639px) {
  .dlg-in { padding: var(--space-3); gap: var(--space-3); }
  .seg button { padding: 0 12px; font-size: 14px; }
  .cols, .col-months { gap: 2px; }
  .col-months { font-size: 12px; }
  /* Too narrow for 12 labels: keep the first and the latest month */
  .col-val:not(.ends) { visibility: hidden; }
  .col-val { font-size: 12px; }
}
</style>
