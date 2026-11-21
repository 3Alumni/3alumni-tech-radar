# Market Radar – frontend (Vue)

Clickable Vue prototype for Powercoders: a Swiss IT job market radar for a non-technical team. Runs from a JSON data snapshot. No live site, no live API calls. Shown in a 3-minute pitch; code freeze 18:00.

Team: 2 backend devs deliver JSON in the agreed data contract; Mariia designs and builds this frontend.
Source of truth: kickoff doc https://claude.ai/artifact/WQbMfXX5ZSvchzx8usDu6u · wireframe https://claude.ai/artifact/GutuYxbEo3ZfpKZjUDPtf8 · design board https://claude.ai/artifact/4pjrQ53r6dL5tMrSbfqoff

## Page structure (one page, anchor navigation)

Header: logo (`client/public/powercoders.svg`, use as `/powercoders.svg`, never recolour) · Market Radar · links Demand / Skills / Employers / Policy and people / Sources · notifications bell with "[n] new" · Subscribe button. Below 1024 px: Menu button.

1. **Intro + filters**: role (Web developer, IT support, Data analyst — not final), region. Filters apply to Demand, Skills, Employers.
2. **This month strip**: role trend, top canton, fastest-rising skill, number of new policy items. Moves below the cards on mobile.
3. **Demand** (`#demand`): bar race of job ads per role by month (plays once, Replay button) · open job ads + trend for the chosen role · canton map.
4. **Skills** (`#skills`): top skills with rising/falling · bump chart of skill rank by month · skill matrix (optional, cut first).
5. **Employers** (`#employers`): company list (open IT jobs, region, junior-friendly / partner / agency tags, careers page link). Filters: junior-friendly, partners, hide agencies. Never individual people.
6. **Policy and people** (`#policy`): "[n] new since [snapshot date]" bar · newest-first timeline of documents (motion, law/rule, statistics) with "New" tag, impact tag, plain-language summary marked "Summary by AI", source chip with download date.
7. **Subscribe** (`#subscribe`): tick sections, weekly (default) or monthly, optional alert for new policy items, email field. DEMO ONLY: store nothing (email = personal data). Show a designed sample email next to it.
8. **Sources** (`#sources`): table source / type / used in / what for / last update / terms. Data rules. "How to add a source" link.
9. **Footer**: section links, powercoders.org, "Data snapshot: [date]", "Jobs by Adzuna · Map: BFS, GEOSTAT".

Every card: question → one-sentence answer → chart → source chip (name with link, last update). Design every state: loading (skeleton), empty, outdated (> 30 days), error (show last snapshot).

## Data the frontend expects (agree with the devs)

- `snapshotDate`
- per role: job ads per month (all roles, for the bar race), open ads last 30 days, change vs 3 months ago, ads per canton
- per role: skill share per month (for trends and the bump chart)
- employers: name, openJobs per role, canton, junior (bool), partner (bool), agency (bool), careersUrl
- policy items: id, type, title, publishedDate, sourceName, sourceUrl, downloadedDate, summary, impact (high|medium|low), isNew
- sources: name, type, usedIn[], purpose, url, lastUpdate, attribution

Load everything through one composable that validates the shape; on mismatch show the error state.

## Charts and effects

- D3.js only: npm package `d3`, pinned `7.9.2` (`npm i -E d3@7.9.2`), docs https://d3js.org. Not `vue-d3`, `react-d3` or other wrappers. Import only the functions you use (`import { scaleLinear, axisBottom } from 'd3'`).
- D3 does the maths (scales, shapes, axes, projections, transitions). Vue owns the DOM: render `<svg>` elements in the template where possible. Call `select()` only on a template `ref` inside `onMounted`/`watch`, never with global selectors. Clean up on unmount.
- One chart = one component (e.g. `DemandBarRace.vue`). Size from the container with `ResizeObserver`.
- Bar race: `scaleBand` + `scaleLinear`, re-sort bars each month, keyed data join (`.data(d, d => d.role)`) + `transition()`; value labels tween with `interpolateNumber`.
- Role switch: keyed joins with stable ids so bars and lines move instead of redrawing.
- Canton map: `swiss-maps@4.7.0` (`swiss-maps/2026/ch-combined.json`, lazy-loaded) → `topojson-client` `feature()` → `geoPath` + `geoMercator().fitSize()` (the file is WGS84 lon/lat, not pre-projected). Credit "BFS, GEOSTAT" (non-commercial licence). Component: `components/charts/CantonMap.vue`.
- Skill trend: bump chart = `line()` + `curveBumpX`, y axis = rank (1 at top).
- Matrix: scatter with `scaleLinear` on both axes + four quadrant `<rect>`s behind the dots.
- Colours from tokens via CSS (`fill: var(--color-action)`), never hex in JS. Labels ≥ 14 px.
- Tooltips open on keyboard focus too, not only on hover.
- Count-up numbers once on first view; no animation when `prefers-reduced-motion: reduce`.
- Colours: data in greys, one highlighted series in red #B23149. No gradients, 3D, gauges, word clouds.
- Every chart has a text alternative (aria-label summary or a hidden table).

## Design tokens

From `design-tokens.md` (Powercoders logo colours): action #B23149, action-strong #8E2639, action-subtle #F8EBEE, text #343534, muted #5E5F5D, border-strong #767775, border #D9D9D7, bg #F6F6F5, surface #FFFFFF, success #1F6B3E / #EAF3ED, warning #7A4F00 / #FBF3E2. System font stack. 8 px spacing (4, 8, 16, 24, 32, 48, 64). Radius 0. Focus 3 px solid #343534, offset 2. Targets ≥ 44 px. Breakpoints 640 / 1024, content max 1152.

## Code rules

- Vue 3 + Vite, `<script setup lang="ts">`, small components, scoped CSS, tokens as CSS variables, no inline styles.
- Plain language, Swiss number format (1'240), dates like 20 Nov 2026.
- No API keys in the frontend; never `v-html` with source text; external links `rel="noopener noreferrer"`; no CDN scripts or tracking; pinned versions (`npm i -E`).
- Never invent numbers; mark placeholder data clearly ("Sample data").
- Ask before adding any library not listed here.

## Git workflow

- Always work on local `main` and push to `origin main`. Do not create feature branches.
- **Ask for approval before every commit and push.** Summarise what changed and wait for an explicit "yes". Approval covers that one change only.
- After approval, from the repo root: `git status` (check for secrets / build output) → `git add .` → `git commit -m "…"` → `git pull --rebase origin main` → `git push origin main`.
- Before asking for approval, run `npm run build` in `client/` and make sure it passes.
- If the pull has conflicts, stop and show them; do not force-push.
