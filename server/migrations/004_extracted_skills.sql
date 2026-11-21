CREATE TABLE IF NOT EXISTS skill_runs (
  posting_id bigint NOT NULL REFERENCES postings (id),
  model text NOT NULL,
  PRIMARY KEY (posting_id, model)
);

CREATE TABLE IF NOT EXISTS extracted_skills (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  posting_id bigint NOT NULL REFERENCES postings (id),
  model text NOT NULL,
  name text NOT NULL,
  bucket text NOT NULL CHECK (bucket IN ('esco', 'new', 'drop')),
  esco_label text,
  esco_uri text
);

CREATE INDEX IF NOT EXISTS extracted_skills_bucket_idx ON extracted_skills (bucket, name);
