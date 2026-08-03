-- Multi-valued venue types (primary = first element). Replaces singular venue_type.

ALTER TABLE catalog_place_ai_enrichments
    ADD COLUMN IF NOT EXISTS venue_types JSONB;

UPDATE catalog_place_ai_enrichments
SET venue_types = to_jsonb(ARRAY[venue_type])
WHERE venue_types IS NULL
  AND venue_type IS NOT NULL
  AND btrim(venue_type) <> '';

UPDATE catalog_place_ai_enrichments
SET venue_types = '["UNKNOWN"]'::jsonb
WHERE venue_types IS NULL;

DROP INDEX IF EXISTS idx_catalog_place_ai_enrichments_type;

ALTER TABLE catalog_place_ai_enrichments
    DROP COLUMN IF EXISTS venue_type;

CREATE INDEX IF NOT EXISTS idx_catalog_place_ai_enrichments_venue_types
    ON catalog_place_ai_enrichments USING GIN (venue_types);

CREATE INDEX IF NOT EXISTS idx_catalog_place_ai_enrichments_primary_type
    ON catalog_place_ai_enrichments ((venue_types ->> 0));
