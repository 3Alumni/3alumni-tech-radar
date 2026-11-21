<script setup lang="ts">
import { computed, ref } from 'vue'
import SkillBars from '@/components/charts/SkillBars.vue'
import { useSkills, type SkillRow } from '@/composables/useSkills'

const ROLES = [
  { id: 'web-developer', label: 'Web developer' },
  { id: 'it-support', label: 'IT support' },
  { id: 'data-analyst', label: 'Data analyst' },
]

/** Job titles Luna still lets through. They are not tools. */
const JOB_TITLE =
  /^(it|ict|erp|remote)[-\s]?support$|^web ?entwicklung$|^web development$|^webdesign$|^web applications$|^softwareentwicklung$|^(front|back)-end-entwicklung$|^it-(projektmanagement|betrieb)$|^data analysis$|^analyse de données$|^business analyse$|^client servicing$/i

const role = ref(ROLES[0]!.id)
const { status, errorMessage, byRole } = useSkills()

const payload = computed(() => byRole.value[role.value] ?? null)
const roleLabel = computed(() => ROLES.find((item) => item.id === role.value)?.label ?? '')
const ads = computed(() => payload.value?.basis.postings ?? 0)

function bars(rows: SkillRow[]) {
  const total = ads.value
  return rows.map((row) => ({
    name: row.label,
    sharePct: total ? Math.round((row.count / total) * 100) : 0,
    mentions: row.count,
  }))
}

const esco = computed(() => bars(payload.value?.esco ?? []))
const own = computed(() => {
  const rows = bars((payload.value?.own ?? []).filter((row) => !JOB_TITLE.test(row.label.trim())))
  const frequent = rows.filter((row) => (row.mentions ?? 0) >= 2)
  return (frequent.length >= 3 ? frequent : rows).slice(0, 12)
})
const escoAnswer = computed(() => {
  const [a, b] = esco.value
  if (!a) return 'No exact ESCO preferred label in these ads.'
  return b ? `${a.name} and ${b.name} come up most often.` : `${a.name} comes up most often.`
})
</script>

<template>
  <section class="view" aria-labelledby="skills-h">
    <div class="card-head">
      <h1 id="skills-h" class="h1">Skills</h1>
      <p class="muted">What employers ask for, and what to teach.</p>
    </div>

    <div class="filters">
      <div class="field seg-field">
        <span id="skill-role-l" class="label">Role</span>
        <div class="seg" role="group" aria-labelledby="skill-role-l">
          <button v-for="item in ROLES" :key="item.id" type="button" :aria-pressed="item.id === role" @click="role = item.id">
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="status === 'loading'" class="muted">Loading skills…</p>
    <p v-else-if="status === 'error'" class="muted">Could not load skills. {{ errorMessage }}</p>

    <div v-else class="cards">
      <article class="card span-2" aria-labelledby="skill-q">
        <div class="card-head">
          <h2 id="skill-q" class="q">Which skills match ESCO?</h2>
          <p>{{ escoAnswer }}</p>
        </div>
        <SkillBars v-if="esco.length" :skills="esco" :role-label="roleLabel" :ads="ads" />
        <p v-else class="muted"><b>No ESCO skill</b> with this exact preferred label.</p>
        <p v-if="ads" class="small muted">
          Share of the {{ ads }} saved ads we read, English and German together. ESCO preferred labels only.
        </p>
      </article>

      <article class="card span-2" aria-labelledby="own-q">
        <div class="card-head">
          <h2 id="own-q" class="q">Not in ESCO</h2>
          <p>Tools named in the ad text, with no exact ESCO preferred label.</p>
        </div>
        <SkillBars v-if="own.length" :skills="own" :role-label="roleLabel" :ads="ads" />
        <p v-else class="muted"><b>No extra tools</b> in these ads.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.filters { display: flex; align-items: flex-end; gap: var(--space-3); flex-wrap: wrap; }
</style>
