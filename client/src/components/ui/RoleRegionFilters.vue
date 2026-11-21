<script setup lang="ts">
import Icon from './Icon.vue'
import { ICON } from '@/lib/format'
import { useFilters } from '@/composables/useFilters'
import { useSnapshot } from '@/composables/useSnapshot'

withDefaults(defineProps<{ showRegion?: boolean; showRole?: boolean }>(), { showRegion: true, showRole: true })
const { roles } = useSnapshot()
const { role, region, regions, setRole, setRegion } = useFilters()
</script>

<template>
  <div class="filters">
    <div v-if="showRole" class="field seg-field">
      <span id="role-l" class="label">Role</span>
      <div class="seg" role="group" aria-labelledby="role-l">
        <button
          v-for="r in roles"
          :key="r.id"
          type="button"
          :aria-pressed="r.id === role"
          @click="setRole(r.id)"
        >{{ r.label }}</button>
      </div>
    </div>
    <div v-if="showRole" class="field role-sel">
      <label class="label" for="role-s">Role</label>
      <div class="sel">
        <select id="role-s" class="input" :value="role" @change="setRole(($event.target as HTMLSelectElement).value)">
          <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.label }}</option>
        </select>
        <Icon :path="ICON.chevronDown" />
      </div>
    </div>
    <div v-if="showRegion" class="field reg-field">
      <label class="label" for="reg-s">Region</label>
      <div class="sel">
        <select id="reg-s" class="input" :value="region" @change="setRegion(($event.target as HTMLSelectElement).value)">
          <option value="all">All of Switzerland</option>
          <option v-for="c in regions" :key="c" :value="c">{{ c }}</option>
        </select>
        <Icon :path="ICON.chevronDown" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.filters { display: flex; align-items: flex-end; gap: var(--space-3); flex-wrap: wrap; }
.reg-field { width: 220px; }
.role-sel { display: none; }
@media (max-width: 639px) {
  .seg-field { display: none; }
  .role-sel { display: flex; }
  .filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; width: 100%; }
  .reg-field { width: auto; }
}
</style>
