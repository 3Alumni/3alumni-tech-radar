ALTER TABLE metrics
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS authority text,
  ADD COLUMN IF NOT EXISTS in_force date,
  ADD COLUMN IF NOT EXISTS text_url text,
  ADD COLUMN IF NOT EXISTS body text;
