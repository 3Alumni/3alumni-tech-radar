# Add a source

1. Add a block to `config/sources.yaml` with `id`, `title`, `questions`, `type`, `url`, and `enabled`.
2. Add a connector class in the block folder that owns that question: `demand`, `skills`, `employers`, `people`, or `policy`. Extend `SourceConnector` from `server/src/core/source-connector.ts`.
3. List that class in the block module `providers` and in the module constructor, so it is created on startup and registers itself.
4. Return `Metric` values. Set `sourceUrl` to the page a colleague can open and `fetchedAt` to the time of the snapshot.
5. Keep raw files, if the source is a spreadsheet or PDF, next to the connector and link the same URL.

No view change is required. The block route already returns every metric for its question.

Set `enabled: false` until one manual fetch writes a snapshot.
