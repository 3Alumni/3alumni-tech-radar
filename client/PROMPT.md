# Starter prompts for Claude Code

Paste these one at a time. Check the result in the browser (`npm run dev`) before the next one.

1. Read CLAUDE.md, docs/design-tokens.md and docs/prototype.dc.html. Then scaffold a Vue 3 + Vite + TypeScript app in this folder (keep docs/ and public/snapshot.json), add src/styles/tokens.css from the design tokens, and build the layout only: header, collapsible sidebar with the 6 tabs and the "Get email summary" button, mobile drawer, and an empty view per tab. Show me the file plan before writing code.

2. Build useSnapshot() and useFilters() against public/snapshot.json, with loading, empty, outdated and error states (StateBlock component).

3. Build the Demand view: Role and Region filters, KPI card with TrendLine (D3 scales and line path, hover tooltips), and CantonBars (click to filter). Match the prototype.

4. Build the Overview view: 4 tiles and the widget grid, including RoleRaceChart (animated once, Replay button, reduced-motion safe) and the SalaryDialog.

5. Build Skills, Employers, Policy and people, Email summary and Sources views.

6. Accessibility pass: keyboard through every view, focus states, chart text alternatives, contrast. Then fix anything that differs from the prototype.
