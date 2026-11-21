CREATE TABLE IF NOT EXISTS snapshots (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id text NOT NULL,
  fetched_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS metrics (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_id bigint NOT NULL REFERENCES snapshots (id),
  label text NOT NULL,
  value text NOT NULL,
  unit text,
  question text NOT NULL CHECK (question IN ('A', 'B', 'C', 'D', 'E')),
  role text,
  geo text,
  period text,
  source_id text NOT NULL,
  source_url text NOT NULL,
  fetched_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS postings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_id bigint NOT NULL REFERENCES snapshots (id),
  source_id text NOT NULL,
  external_id text,
  role text,
  title text NOT NULL,
  company text,
  location text,
  url text NOT NULL,
  snippet text,
  fetched_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS metrics_question_fetched_at_idx ON metrics (question, fetched_at DESC);
CREATE INDEX IF NOT EXISTS postings_snapshot_id_idx ON postings (snapshot_id);
