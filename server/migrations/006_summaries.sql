CREATE TABLE IF NOT EXISTS summaries (
  cache_key text PRIMARY KEY,
  title_en text,
  body text NOT NULL,
  key_changes jsonb NOT NULL,
  key_updates jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
