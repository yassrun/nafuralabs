-- Default setting INDOOR when unset (explicit empty [] after operator uncheck is allowed later)

UPDATE catalog_place_ai_enrichments
SET settings = '["INDOOR"]'::jsonb,
    updated_at = NOW()
WHERE settings IS NULL
   OR settings = '[]'::jsonb
   OR settings = 'null'::jsonb;
