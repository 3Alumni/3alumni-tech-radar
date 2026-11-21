CREATE TABLE IF NOT EXISTS company_tag_runs (
  company_key text NOT NULL,
  model text NOT NULL,
  PRIMARY KEY (company_key, model)
);

CREATE TABLE IF NOT EXISTS company_tags (
  company_key text NOT NULL,
  model text NOT NULL,
  tag text NOT NULL,
  position smallint NOT NULL,
  evidence text,
  PRIMARY KEY (company_key, model, tag)
);
