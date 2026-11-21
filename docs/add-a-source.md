# Add a source

1. Add a block to `config/sources.yaml` with `id`, `title`, `questions`, `type`, `url`, and `enabled`.
2. Create `server/src/connectors/<id>/` and implement `Connector` from `server/src/connectors/connector.ts`.
3. Return `Metric` values. Set `sourceUrl` to the page a colleague can open and `fetchedAt` to the time of the snapshot.
4. Keep raw files, if the source is a spreadsheet or PDF, next to the connector and link the same URL.

No view change is required. A tab already renders every metric for its question.

Set `enabled: false` until one manual fetch writes a snapshot.
