-- Manual taxonomy overrides by catalog operators / reviewers

ALTER TABLE catalog_place_ai_enrichments
    ADD COLUMN IF NOT EXISTS manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS manual_override_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS manual_override_by VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_catalog_place_ai_enrichments_manual
    ON catalog_place_ai_enrichments(manual_override)
    WHERE manual_override = TRUE;
