<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import RadarLoader from '@/components/ui/RadarLoader.vue'
import Icon from '@/components/ui/Icon.vue'
import { ICON, fmtMonth, listJoin } from '@/lib/format'
import { parts } from '@/lib/links'
import { API } from '@/lib/api'

/** DEMO ONLY: nothing is stored or sent. An email address is personal data. */

const SECTIONS = [
  { key: 'demand', label: 'Demand', question: 'A' },
  { key: 'skills', label: 'Skills', question: 'B' },
  { key: 'employers', label: 'Employers', question: 'C' },
  { key: 'policy', label: 'Policy', question: 'E' },
] as const

type SectionKey = (typeof SECTIONS)[number]['key']

interface Briefing {
  text: string
  keyChanges: string[]
  keyUpdates: string[]
  loading: boolean
  error: string
}

const form = reactive({
  demand: true,
  skills: true,
  employers: false,
  policy: false,
  freq: 'weekly' as 'weekly' | 'monthly',
  email: '',
})
const briefings = ref<Partial<Record<SectionKey, Briefing>>>({})
const error = ref('')
const submitted = ref(false)
const emailEl = ref<HTMLInputElement | null>(null)

const chosen = computed(() => SECTIONS.filter((section) => form[section.key]))

const subject = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  const when = form.freq === 'weekly' ? `Week ${isoWeek(today)}` : fmtMonth(today.slice(0, 7), true)
  const names = chosen.value.map((section) => section.label)
  return ['Market Radar', when, names.length ? listJoin(names) : ''].filter(Boolean).join(' · ')
})

onMounted(() => {
  void sync()
})

async function sync() {
  await Promise.all(chosen.value.map((section) => load(section.key)))
}

async function load(key: SectionKey) {
  const current = briefings.value[key]
  if (current?.text || current?.loading) return
  const section = SECTIONS.find((item) => item.key === key)
  if (!section) return
  briefings.value = { ...briefings.value, [key]: { text: '', keyChanges: [], keyUpdates: [], loading: true, error: '' } }
  try {
    const response = await fetch(`${API}/questions/${section.question}/preview`)
    if (!response.ok) throw new Error(`Summary ${response.status}`)
    const body = (await response.json()) as { text?: string; keyChanges?: string[]; keyUpdates?: string[] }
    briefings.value = {
      ...briefings.value,
      [key]: {
        text: body.text ?? '',
        keyChanges: body.keyChanges ?? [],
        keyUpdates: body.keyUpdates ?? [],
        loading: false,
        error: '',
      },
    }
  } catch (e) {
    briefings.value = {
      ...briefings.value,
      [key]: {
        text: '',
        keyChanges: [],
        keyUpdates: [],
        loading: false,
        error: e instanceof Error ? e.message : String(e),
      },
    }
  }
}

function touch() {
  submitted.value = false
  error.value = ''
}

function submit() {
  if (!chosen.value.length) {
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

function letterPoints(text: string) {
  return text
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const match = paragraph.match(/\s*Source:\s*([\s\S]+)$/i)
      if (!match || match.index == null) return { body: paragraph, source: '' }
      return { body: paragraph.slice(0, match.index).trim(), source: match[1].trim() }
    })
}

function isoWeek(iso: string) {
  const d = new Date(iso + 'T00:00:00Z')
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - y.getTime()) / 86_400_000 + 1) / 7)
}
</script>

<template>
  <section class="view" aria-labelledby="mail-h">
    <div class="split">
      <form class="panel" novalidate @submit.prevent="submit" @change="touch(); sync()">
        <div class="card-head">
          <h1 id="mail-h" class="h2">Get a summary by email</h1>
          <p class="muted">Plain language, with a source link under each point.</p>
        </div>
        <fieldset class="checks">
          <legend>Sections</legend>
          <label class="check"><input v-model="form.demand" type="checkbox" />Demand</label>
          <label class="check"><input v-model="form.skills" type="checkbox" />Skills</label>
          <label class="check"><input v-model="form.employers" type="checkbox" />Employers</label>
          <label class="check"><input v-model="form.policy" type="checkbox" />Policy</label>
        </fieldset>
        <fieldset class="checks">
          <legend>How often</legend>
          <label class="check"><input v-model="form.freq" type="radio" name="freq" value="weekly" />Weekly</label>
          <label class="check"><input v-model="form.freq" type="radio" name="freq" value="monthly" />Monthly</label>
        </fieldset>
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
            <p v-if="!chosen.length" class="muted">Pick at least one section to see a preview.</p>
            <div v-for="section in chosen" :key="section.key" class="mail-pt">
              <p class="label">{{ section.label }}</p>
              <RadarLoader v-if="briefings[section.key]?.loading" text="Writing the summary…" compact />
              <p v-else-if="briefings[section.key]?.error" class="small" role="alert">{{ briefings[section.key]?.error }}</p>
              <template v-else-if="briefings[section.key]?.text">
                <template v-for="(point, n) in letterPoints(briefings[section.key]!.text)" :key="n">
                  <p>
                    <template v-for="(chunk, i) in parts(point.body)" :key="i">
                      <a v-if="chunk.href" :href="chunk.href" target="_blank" rel="noopener noreferrer">{{ chunk.text }}</a>
                      <template v-else>{{ chunk.text }}</template>
                    </template>
                  </p>
                  <p v-if="point.source" class="small muted">
                    Source:
                    <template v-for="(chunk, i) in parts(point.source)" :key="i">
                      <a v-if="chunk.href" :href="chunk.href" target="_blank" rel="noopener noreferrer">{{ chunk.text }}</a>
                      <template v-else>{{ chunk.text }}</template>
                    </template>
                  </p>
                </template>
                <div v-if="briefings[section.key]!.keyChanges.length">
                  <p class="label">Key changes</p>
                  <ul>
                    <li v-for="point in briefings[section.key]!.keyChanges" :key="point">
                      <template v-for="(chunk, i) in parts(point)" :key="i">
                        <a v-if="chunk.href" :href="chunk.href" target="_blank" rel="noopener noreferrer">{{ chunk.text }}</a>
                        <template v-else>{{ chunk.text }}</template>
                      </template>
                    </li>
                  </ul>
                </div>
                <div v-if="briefings[section.key]!.keyUpdates.length">
                  <p class="label">Key updates</p>
                  <ul>
                    <li v-for="point in briefings[section.key]!.keyUpdates" :key="point">
                      <template v-for="(chunk, i) in parts(point)" :key="i">
                        <a v-if="chunk.href" :href="chunk.href" target="_blank" rel="noopener noreferrer">{{ chunk.text }}</a>
                        <template v-else>{{ chunk.text }}</template>
                      </template>
                    </li>
                  </ul>
                </div>
              </template>
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
.mail-body ul { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: 4px; }
@media (max-width: 1023px) {
  .split { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 639px) {
  .panel { padding: var(--space-3); }
}
</style>
