<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import RadarLoader from '@/components/ui/RadarLoader.vue'
import Icon from '@/components/ui/Icon.vue'
import { ICON, fmtDate, fmtMonth, fmtNum, listJoin } from '@/lib/format'
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

interface Line { body: string; source: string }

interface Briefing {
  summary: string
  items: Line[]
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
  if (current?.summary || current?.items.length || current?.loading) return
  const section = SECTIONS.find((item) => item.key === key)
  if (!section) return
  briefings.value = { ...briefings.value, [key]: emptyBriefing(true) }
  try {
    const briefing = key === 'policy' ? await policyBriefing() : await pageBriefing(key)
    briefings.value = { ...briefings.value, [key]: briefing }
  } catch (e) {
    briefings.value = {
      ...briefings.value,
      [key]: { ...emptyBriefing(false), error: e instanceof Error ? e.message : String(e) },
    }
  }
}

function emptyBriefing(loading: boolean): Briefing {
  return { summary: '', items: [], keyChanges: [], keyUpdates: [], loading, error: '' }
}

async function policyBriefing(): Promise<Briefing> {
  const [preview, acts] = await Promise.all([
    fetch(`${API}/questions/E/preview`),
    fetch(`${API}/policy`),
  ])
  if (!preview.ok) throw new Error(`Summary ${preview.status}`)
  if (!acts.ok) throw new Error(`Summary ${acts.status}`)
  const body = (await preview.json()) as { text?: string; keyChanges?: string[]; keyUpdates?: string[] }
  const rows = (await acts.json()) as { label?: string; value?: string | number; sourceUrl?: string; inForce?: string; reference?: string }[]
  return {
    summary: body.text ?? '',
    items: policyItems(rows),
    keyChanges: body.keyChanges ?? [],
    keyUpdates: body.keyUpdates ?? [],
    loading: false,
    error: '',
  }
}

async function pageBriefing(key: Exclude<SectionKey, 'policy'>): Promise<Briefing> {
  const path = key === 'demand' ? '/demand' : key === 'skills' ? '/skills' : '/employers'
  const response = await fetch(`${API}${path}`)
  if (!response.ok) throw new Error(`Summary ${response.status}`)
  const body = await response.json()
  const section = key === 'demand' ? demandSection(body) : key === 'skills' ? skillsSection(body) : employersSection(body)
  return { ...section, keyChanges: [], keyUpdates: [], loading: false, error: '' }
}

const ROLE_LABEL: Record<string, string> = {
  'web-developer': 'Web developer',
  'it-support': 'IT support',
  'data-analyst': 'Data analyst',
}
const LANG_LABEL: Record<string, string> = { en: 'English', de: 'German' }

function demandSection(body: {
  roles?: { role: string; lang: string | null; openings: number; sourceUrl: string; fetchedAt: string; cantons: { canton: string; postings: number }[] }[]
}): Pick<Briefing, 'summary' | 'items'> {
  const roles = body.roles ?? []
  if (!roles.length) return { summary: 'No jobs on the Demand page yet.', items: [] }
  const groups = new Map<string, typeof roles>()
  for (const role of roles) {
    const list = groups.get(role.role) ?? []
    list.push(role)
    groups.set(role.role, list)
  }
  const items = [...groups.entries()].map(([role, rows]) => {
    const counts = rows.map((row) => `${fmtNum(row.openings)} ${LANG_LABEL[row.lang ?? ''] ?? row.lang ?? ''}`.trim())
    const top = rows.flatMap((row) => row.cantons).sort((a, b) => b.postings - a.postings)[0]
    const where = top ? ` Most jobs are in ${top.canton} (${fmtNum(top.postings)}).` : ''
    const when = rows[0]?.fetchedAt ? ` · ${fmtDate(rows[0].fetchedAt.slice(0, 10))}` : ''
    return {
      body: `${ROLE_LABEL[role] ?? role}: ${counts.join(' and ')}.${where}`,
      source: `Adzuna, ${rows[0]?.sourceUrl ?? 'https://www.adzuna.ch/'}${when}`,
    }
  })
  return { summary: '', items }
}

/** "IT support: 1'240 German." → head "IT support" (shown bold) + rest. No colon → no head. */
function splitHead(body: string): { head: string; rest: string } {
  const i = body.indexOf(': ')
  return i > 0 ? { head: body.slice(0, i), rest: body.slice(i + 2) } : { head: '', rest: body }
}

function skillsSection(body: {
  basis?: { postings: number; sourceUrl: string; dictionaryUrl: string }
  esco?: { label: string; count: number }[]
}): Pick<Briefing, 'summary' | 'items'> {
  const ads = body.basis?.postings ?? 0
  const skills = (body.esco ?? []).filter((skill) => skill.count > 0).slice(0, 8)
  const source = `Adzuna, ${body.basis?.sourceUrl ?? 'https://www.adzuna.ch/'} · ESCO, ${body.basis?.dictionaryUrl ?? 'https://esco.ec.europa.eu/en/classification/skill_main'}`
  if (!ads || !skills.length) return { summary: '', items: [] }
  return {
    summary: '',
    items: skills.map((skill) => ({ body: `${skill.label}: ${fmtNum(skill.count)} of ${fmtNum(ads)} jobs`, source })),
  }
}

function employersSection(body: {
  basis?: { postings: number; sourceUrl: string }
  outreach?: { company: string; postings: number; urls: string[] }[]
  agencies?: unknown[]
}): Pick<Briefing, 'summary' | 'items'> {
  const ads = body.basis?.postings ?? 0
  const companies = body.outreach ?? []
  if (!ads || !companies.length) return { summary: '', items: [] }
  return {
    summary: '',
    items: companies.slice(0, 8).map((company) => ({
      body: `${company.company}: ${fmtNum(company.postings)} jobs`,
      source: `${company.company}, ${company.urls[0] ?? body.basis?.sourceUrl ?? 'https://www.adzuna.ch/'}`,
    })),
  }
}

function policyItems(rows: { label?: string; value?: string | number; sourceUrl?: string; inForce?: string; reference?: string }[]): Line[] {
  return [...rows]
    .filter((row) => row.label && row.sourceUrl)
    .sort((a, b) => String(b.value ?? '').localeCompare(String(a.value ?? '')))
    .slice(0, 5)
    .map((act) => {
      const published = fmtDate(String(act.value ?? '').slice(0, 10))
      const ref = act.reference ? ` ${act.reference}.` : ''
      const force = act.inForce ? ` In force ${fmtDate(String(act.inForce).slice(0, 10))}.` : ''
      return { body: `${published}: ${act.label}.${ref}${force}`, source: `Fedlex, ${act.sourceUrl}` }
    })
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
              <template v-else-if="briefings[section.key]?.summary || briefings[section.key]?.items.length">
                <template v-for="(point, n) in letterPoints(briefings[section.key]!.summary)" :key="'s' + n">
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
                <ul v-if="briefings[section.key]!.items.length">
                  <li v-for="item in briefings[section.key]!.items" :key="item.body">
                    <template v-if="splitHead(item.body).head"><b>{{ splitHead(item.body).head }}:</b> {{ splitHead(item.body).rest }}</template>
                    <template v-else>{{ item.body }}</template>
                    <span class="small muted src-row">
                      Source:
                      <template v-for="(chunk, i) in parts(item.source)" :key="i">
                        <a v-if="chunk.href" :href="chunk.href" target="_blank" rel="noopener noreferrer">{{ chunk.text }}</a>
                        <template v-else>{{ chunk.text }}</template>
                      </template>
                    </span>
                  </li>
                </ul>
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
.mail { border: var(--border) solid var(--color-border-strong); background: var(--color-surface); display: flex; flex-direction: column; min-width: 0; }
.mail-head { padding: 12px var(--space-3); border-bottom: var(--border) solid var(--color-border); background: var(--color-bg); font-size: 14px; line-height: 20px; overflow-wrap: anywhere; }
.mail-body { padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-3); min-width: 0; overflow-wrap: anywhere; }
.mail-body a { overflow-wrap: anywhere; word-break: break-all; }
.mail-pt { display: flex; flex-direction: column; gap: var(--space-1); padding-bottom: var(--space-3); border-bottom: var(--border) solid var(--color-border); min-width: 0; }
.mail-body ul { margin: 0; padding-left: 1.1rem; display: flex; flex-direction: column; gap: var(--space-3); }
@media (max-width: 1023px) {
  .split { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 639px) {
  .panel { padding: var(--space-3); }
}
.src-row { display: block; margin-top: 2px; }
</style>
