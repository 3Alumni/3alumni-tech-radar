<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import { ICON, fmtDate, fmtMonth, listJoin } from '@/lib/format'
import { useInsights } from '@/composables/useInsights'
import { useSnapshot } from '@/composables/useSnapshot'
import { useView } from '@/composables/useView'

/** DEMO ONLY: nothing is stored or sent. An email address is personal data. */
const { snapshot, newPolicyCount, sourceByName } = useSnapshot()
const ins = useInsights()
const { go } = useView()

const form = reactive({
  demand: true,
  skills: true,
  employers: false,
  policy: false,
  freq: 'weekly' as 'weekly' | 'monthly',
  alertNew: true,
  email: '',
})
const error = ref('')
const submitted = ref(false)
const emailEl = ref<HTMLInputElement | null>(null)

const sectionNames = computed(() =>
  [form.demand && 'Demand', form.skills && 'Skills', form.employers && 'Employers', form.policy && 'Policy'].filter(Boolean) as string[],
)

function srcDate(...names: string[]) {
  const d = names.map((n) => sourceByName(n)?.lastUpdate).find(Boolean)
  return d ? fmtDate(d) : ''
}

function isoWeek(iso: string) {
  const d = new Date(iso + 'T00:00:00Z')
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - y.getTime()) / 86_400_000 + 1) / 7)
}

const subject = computed(() => {
  const s = snapshot.value?.snapshotDate
  const when = !s ? '' : form.freq === 'weekly' ? `Week ${isoWeek(s)}` : fmtMonth(s.slice(0, 7), true)
  return ['Market Radar', when, sectionNames.value.length ? listJoin(sectionNames.value) : ''].filter(Boolean).join(' · ')
})

const points = computed(() => {
  const out: { h: string; t: string; src: string; d: string }[] = []
  const top = ins.cantonsSorted.value[0]
  const firstSkill = ins.skills.value[0]
  const firstPolicy = ins.policySorted.value[0]
  if (form.demand)
    out.push({ h: 'Demand', t: `${ins.roleLabel.value} job ads ${ins.changeText.value}.${top ? ' Most ads are in ' + top.canton + '.' : ''}`, src: 'Adzuna', d: srcDate('Adzuna') })
  if (form.skills && firstSkill)
    out.push({ h: 'Skills', t: `${firstSkill.name} is the most requested skill. ${ins.risingSkill.value} climbed the most.`, src: 'ESCO + Adzuna', d: srcDate('ESCO', 'Adzuna') })
  if (form.employers)
    out.push({ h: 'Employers', t: ins.employersAnswer.value, src: 'Adzuna + Zefix', d: srcDate('Adzuna', 'Zefix') })
  if (form.policy && firstPolicy)
    out.push({ h: 'Policy and people', t: `${newPolicyCount.value} new items. Most important: ${firstPolicy.title}.`, src: firstPolicy.sourceName, d: fmtDate(firstPolicy.downloadedDate) })
  return out
})

function touch() {
  submitted.value = false
  error.value = ''
}

function submit() {
  if (!sectionNames.value.length) {
    error.value = 'Pick at least one section.'
    submitted.value = false
    return
  }
  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    error.value = 'Enter your email address, for example name@organisation.org.'
    submitted.value = false
    emailEl.value?.focus()
    return
  }
  error.value = ''
  submitted.value = true
  form.email = '' // store nothing
}
</script>

<template>
  <section class="view" aria-labelledby="mail-h">
    <div class="split">
      <form class="panel" novalidate @submit.prevent="submit" @change="touch">
        <div class="card-head">
          <h1 id="mail-h" class="h2">Get a summary by email</h1>
          <p class="muted">Plain language, with a source link under each point.</p>
        </div>
        <fieldset class="checks">
          <legend>Sections</legend>
          <label class="check"><input v-model="form.demand" type="checkbox" />Demand</label>
          <label class="check"><input v-model="form.skills" type="checkbox" />Skills</label>
          <label class="check"><input v-model="form.employers" type="checkbox" />Employers</label>
          <label class="check"><input v-model="form.policy" type="checkbox" />Policy and people</label>
        </fieldset>
        <fieldset class="checks">
          <legend>How often</legend>
          <label class="check"><input v-model="form.freq" type="radio" name="freq" value="weekly" />Weekly</label>
          <label class="check"><input v-model="form.freq" type="radio" name="freq" value="monthly" />Monthly</label>
        </fieldset>
        <label class="check"><input v-model="form.alertNew" type="checkbox" />Also alert me when new policy items arrive</label>
        <div class="field">
          <label class="label" for="mail">Email address</label>
          <input
            id="mail"
            ref="emailEl"
            v-model="form.email"
            class="input"
            type="email"
            autocomplete="email"
            placeholder="name@organisation.org"
            :aria-invalid="error.includes('email')"
            aria-describedby="mail-e"
            @input="touch"
          />
          <span id="mail-e" aria-live="polite">
            <span v-if="error" class="err"><Icon :path="ICON.error" small />{{ error }}</span>
          </span>
        </div>
        <button type="submit" class="btn btn-primary submit">Subscribe</button>
        <div aria-live="polite">
          <p v-if="submitted" class="alert al-ok">
            <Icon :path="ICON.check" />
            <span><b>Done (demo).</b> Nothing was saved: this prototype stores no email addresses.</span>
          </p>
        </div>
      </form>

      <div class="panel">
        <p class="label muted">Preview</p>
        <div class="mail">
          <div class="mail-head"><b>{{ subject }}</b></div>
          <div class="mail-body">
            <p v-if="!points.length" class="muted">Pick at least one section to see a preview.</p>
            <div v-for="m in points" :key="m.h" class="mail-pt">
              <p class="label">{{ m.h }}</p>
              <p>{{ m.t }}</p>
              <p class="small muted">
                Source: <a href="#sources" @click.prevent="go('sources')">{{ m.src }}</a><template v-if="m.d"> · {{ m.d }}</template>
              </p>
            </div>
            <p class="small muted">Unsubscribe link goes here</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4); }
.panel {
  background: var(--color-surface); border: var(--border) solid var(--color-border); padding: var(--space-4);
  display: flex; flex-direction: column; gap: var(--space-3); min-width: 0;
}
.submit { align-self: flex-start; }
.alert { display: flex; gap: 10px; align-items: flex-start; padding: 12px 16px; border: var(--border) solid; font-size: 14px; line-height: 20px; }
.al-ok { background: var(--color-success-subtle); border-color: var(--color-success); }
.al-ok .ico { color: var(--color-success); }
.mail { border: var(--border) solid var(--color-border-strong); background: var(--color-surface); display: flex; flex-direction: column; }
.mail-head { padding: 12px var(--space-3); border-bottom: var(--border) solid var(--color-border); background: var(--color-bg); font-size: 14px; line-height: 20px; }
.mail-body { padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-3); }
.mail-pt { display: flex; flex-direction: column; gap: var(--space-1); padding-bottom: var(--space-3); border-bottom: var(--border) solid var(--color-border); }
@media (max-width: 1023px) {
  .split { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 639px) {
  .panel { padding: var(--space-3); }
}
</style>
