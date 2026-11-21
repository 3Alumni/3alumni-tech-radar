# Swiss IT Job Market Radar

**By:** Powercoders · **Focus:** Employment, Education

A tool that shows a non-technical team at a glance where the Swiss IT job market is heading, which skills employers ask for and which policy changes matter.

**Head start with the jury:** this challenge comes from an organisation facing the problem right now, so the need is proven. The jury is asked to score Impact at least 3 of 5 (Desirable is one of the Impact lenses: Desirable · Viable · Feasible · Ethical). Bring your own idea and you argue that score from scratch.

**Contact:** Susanne König · **On site:** Saturday

---

## Context

Powercoders trains refugees and migrants in IT and places them in internships and jobs with Swiss companies.
Every programme decision depends on the market outside: which roles are in demand, which skills we teach,
which employers we approach, and which rules change for our participants.

Today this knowledge is scattered. Someone reads a job market report, someone else notices a new law, a third person
hears from an employer. Nobody has the full picture, and nobody has time to check a dozen sources every month.
Our team is not technical, so the answer cannot be another spreadsheet or a script only one person can run.

We want to look at the market along five questions:

| | Question | What we want to know |
|---|---|---|
| A | Demand: is there work for our graduates? | Open IT positions, entry-level and junior roles, regions, trend over time |
| B | Skills: what should we teach? | Skills and tools named in job postings, rising and falling |
| C | Employers: who should we talk to? | Companies hiring for roles that fit our graduates |
| D | Target group: context for our participants | Refugee and migrant population: residence status, origin, canton, labour market integration |
| E | Policy watch: what forces us to change the programme? | New laws, parliamentary motions, job reporting obligations, asylum and integration rules |

---

## Problem

We are looking for a prototype that grows in levels. Level 1 is what we need most; each further level adds to it.

**Level 1: dashboard for A and B.** A dashboard that shows current demand and the most requested skills for the roles our graduates go into (e.g. web developer, IT support, data analyst), with the trend over the last months. It must be usable by non-technical staff without help.

**Level 2: scheduled reports.** A user picks topics or sources (e.g. "skills for IT support" or "new policy on status F") and gets a regular summary by email, in plain language, with links to the sources. AI is welcome for the summaries.

**Level 3: C, D and E.** Add employers to approach, target group context and a policy watch that flags changes which could affect our programme.

**Level 4: add sources without a developer.** New data sources can be plugged in later with little effort, with clear documentation of how. Ideally, a new source is a short config entry, not a code change.

### Rules for the data

Aggregate data only, no personal data. No scraping where the terms of a source forbid it (e.g. LinkedIn, jobs.ch): use official APIs, open data and published reports. Every number in the tool should show where it comes from and how current it is.

### Source references

Wherever the tool shows a number, chart or summary (dashboard, report email, or an answer to a question), it names the source and links to it, so our team can check the original. Dates of the last update belong there too.

### Openness and creativity

The sources below are examples, not a checklist. You are welcome to bring your own sources and ideas that make sense for a market radar in Switzerland and Europe. Please keep to the data rules above.

---

## What you get

Example sources, with the questions they cover:

| Source | Questions |
|---|---|
| LinkedIn (job postings, Economic Graph reports) | A, B, C |
| Adzuna API (job postings) | A, B, C |
| Adecco Swiss Job Market Index | A |
| Federal Statistical Office (BFS) | A, D |
| SECO / job-room.ch (job reporting list) | A, E |
| State Secretariat for Migration (SEM) | D, E |
| Fedlex (federal law) | E |
| Swiss Parliament (Curia Vista) | E |
| Eurostat | A, D |
| ESCO (EU skills and occupations) | B |

We answer questions about our programme, the roles our graduates go into and what our team needs day to day.

## Skills that help

Data · Software Development · AI & Machine Learning · Design & UX
