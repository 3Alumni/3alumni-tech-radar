# Architecture

One repo, two apps. The client renders metrics. The server collects them. Neither tab calls Adzuna, BFS, or Fedlex on its own.

## Folders

| Path | Owns |
|---|---|
| `client/src/views` | Demand, Skills, Employers, Context, Sources |
| `server/src/connectors` | One folder per source. Same `Connector` interface. |
| `server/src/metrics` | The metric contract. |
| `server/src/store` | Snapshots. Tabs read the latest snapshot. |
| `server/src/registry` | Loads `config/*.yaml`. |
| `server/src/skills` | ESCO match and `synonyms.yaml`. |
| `server/src/summaries` | One model. Policy prose, a short people readout, nothing else. |
| `server/src/reports` | Sends a stored summary for a topic in `topics.yaml`. |
| `config/` | Sources, roles, topics, synonyms, agencies. |
| `docs/` | This note and how to add a source. |

Context is one view with two blocks (people, policy) and two connectors.

## Models

- Summaries: one hosted model. Input is stored records only (value, date, url). The code inserts numbers.
- Skills: one embedding model. It suggests a match. The chart updates only from `synonyms.yaml`.
- Employers: `agencies.yaml` and phrases. No model.

## Provenance

Every metric carries `sourceId`, `sourceUrl`, and `fetchedAt`. The client prints them on the figure.
