-- Fields seen on the saved Adzuna response for CH "web developer".
-- external_id = id
-- company = company.display_name
-- location = location.display_name
-- url = redirect_url
-- snippet = description (Adzuna returns 500 characters)
-- location_area = location.area
-- category_tag = category.tag
-- posted_at = created
-- raw = the whole result object

ALTER TABLE postings
  ADD COLUMN IF NOT EXISTS location_area jsonb,
  ADD COLUMN IF NOT EXISTS category_tag text,
  ADD COLUMN IF NOT EXISTS posted_at timestamptz,
  ADD COLUMN IF NOT EXISTS raw jsonb;
