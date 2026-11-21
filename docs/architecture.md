# Architecture

One repo, two apps. The client renders metrics. The server collects them. Neither tab calls Adzuna, BFS, or Fedlex on its own.

## Folders

| Path | Owns |
|---|---|
| `client/src/views` | Demand, Skills, Employers, Context, Sources |
| `server/src/connectors` | Nest module. One folder per source, same `Connector` interface. |
| `server/src/metrics` | The metric contract. Not a Nest module. |
| `server/src/store` | Nest module. Latest snapshot, `GET /metrics`. |
| `server/src/registry` | Nest module. Loads `config/*.yaml`, `GET /sources`. |
| `server/src/skills` | Nest module. ESCO match and `synonyms.yaml`. |
| `server/src/employers` | Nest module. Agency list and phrases. |
| `server/src/summaries` | Nest module. One model. Policy prose, a short people readout. |
| `server/src/reports` | Nest module. Topic preview from a stored summary, `GET /topics`. |
| `config/` | Sources, roles, topics, synonyms, agencies. |
| `docs/` | This note and how to add a source. |

Context is one view with two blocks (people, policy) and two connectors.

## Models

- Summaries: one hosted model. Input is stored records only (value, date, url). The code inserts numbers.
- Skills: one embedding model. It suggests a match. The chart updates only from `synonyms.yaml`.
- Employers: `agencies.yaml` and phrases. No model.

## Provenance

Every metric carries `sourceId`, `sourceUrl`, and `fetchedAt`. The client prints them on the figure.
