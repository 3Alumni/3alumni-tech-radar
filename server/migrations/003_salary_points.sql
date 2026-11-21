CREATE TABLE IF NOT EXISTS salary_points (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category text NOT NULL,
  month date NOT NULL,
  salary numeric NOT NULL,
  source_id text NOT NULL,
  source_url text NOT NULL,
  fetched_at timestamptz NOT NULL,
  UNIQUE (category, month, fetched_at)
);
