CREATE TABLE IF NOT EXISTS source_files (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_id bigint NOT NULL REFERENCES snapshots (id),
  source_id text NOT NULL,
  file_id text NOT NULL,
  format text NOT NULL,
  period text,
  page text,
  source_url text NOT NULL,
  content bytea NOT NULL,
  fetched_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS source_files_snapshot_id_idx ON source_files (snapshot_id);
