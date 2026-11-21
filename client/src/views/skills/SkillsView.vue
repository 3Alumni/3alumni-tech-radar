<script setup lang="ts">
import DataAlerts from '@/components/ui/DataAlerts.vue'
import CardState from '@/components/ui/CardState.vue'
import SourceChip from '@/components/ui/SourceChip.vue'
import RoleRegionFilters from '@/components/ui/RoleRegionFilters.vue'
import SkillBars from '@/components/charts/SkillBars.vue'
import { useInsights } from '@/composables/useInsights'
import { useSnapshot } from '@/composables/useSnapshot'

const { canShow } = useSnapshot()
const ins = useInsights()
</script>

<template>
  <section class="view" aria-labelledby="skills-h">
    <div class="card-head">
      <h1 id="skills-h" class="h1">Skills</h1>
      <p class="muted">What employers ask for, and what to teach.</p>
    </div>
    <!-- Skill shares are national: only the role filter applies here. -->
    <RoleRegionFilters :show-region="false" />
    <DataAlerts />

    <div class="cards">
      <article class="card span-2" aria-labelledby="skill-q">
        <div class="card-head">
          <h2 id="skill-q" class="q">Which skills do employers ask for?</h2>
          <p v-if="canShow">{{ ins.skillAnswer.value }}</p>
        </div>
        <CardState :empty="!ins.skills.value.length">
          <template #empty><b>No skills yet.</b> There are no job ads in this snapshot.</template>
          <SkillBars :skills="ins.skills.value" :role-label="ins.roleLabel.value" />
          <p class="small muted">% of {{ ins.roleLabel.value }} job ads that name the skill</p>
          <SourceChip :names="['ESCO', 'Adzuna']" />
        </CardState>
      </article>
    </div>
  </section>
</template>
