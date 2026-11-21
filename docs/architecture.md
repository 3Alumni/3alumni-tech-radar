# Architecture

One repo, two apps. The client renders metrics. The server collects them.

`server/src` has one folder per block. `core` is the shared snapshot and config loader. It is not a tab.

| Folder | Block |
|---|---|
| `demand` | Open roles. Adzuna and BFS write question A. |
| `skills` | Skills for those roles. Question B. |
| `employers` | Who to contact, agencies filtered out. Question C. |
| `people` | Residence status and canton. SEM writes question D. |
| `policy` | Laws and motions. Fedlex writes question E. |
| `sources` | What is connected. `GET /sources`. |
| `summaries` | One text model for people, policy, and mail. |
| `reports` | Email topics. Sends a summary already stored. |
| `core` | Metric shape, yaml, snapshot, `POST /refresh`. |

The Context screen can show people and policy together. On the server they stay apart because the data arrives from different places.

Adzuna also supplies the postings that skills and employers read. The connector file lives in `demand`.
