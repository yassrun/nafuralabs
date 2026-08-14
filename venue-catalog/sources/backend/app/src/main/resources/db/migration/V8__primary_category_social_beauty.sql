-- Collapse primary categories to SOCIAL_VENUE | BEAUTY | OTHER

UPDATE catalog_places
SET primary_category = 'SOCIAL_VENUE',
    updated_at = NOW()
WHERE primary_category IN ('SOCIAL_DINING', 'NIGHTLIFE_VENUE');

UPDATE catalog_places
SET primary_category = 'BEAUTY',
    updated_at = NOW()
WHERE primary_category IN ('SALON', 'SPA', 'BARBERSHOP');

-- Seed beauty venue types from Google provider_types when enrichment is UNKNOWN/empty
UPDATE catalog_place_ai_enrichments a
SET venue_types = '["BARBERSHOP"]'::jsonb,
    updated_at = NOW()
FROM catalog_places p
WHERE a.catalog_place_id = p.id
  AND p.primary_category = 'BEAUTY'
  AND (
        a.venue_types IS NULL
        OR a.venue_types = '[]'::jsonb
        OR a.venue_types = '["UNKNOWN"]'::jsonb
      )
  AND p.provider_types::text ILIKE '%barber%';

UPDATE catalog_place_ai_enrichments a
SET venue_types = '["SPA"]'::jsonb,
    updated_at = NOW()
FROM catalog_places p
WHERE a.catalog_place_id = p.id
  AND p.primary_category = 'BEAUTY'
  AND (
        a.venue_types IS NULL
        OR a.venue_types = '[]'::jsonb
        OR a.venue_types = '["UNKNOWN"]'::jsonb
      )
  AND p.provider_types::text ILIKE '%spa%';

UPDATE catalog_place_ai_enrichments a
SET venue_types = '["SALON"]'::jsonb,
    updated_at = NOW()
FROM catalog_places p
WHERE a.catalog_place_id = p.id
  AND p.primary_category = 'BEAUTY'
  AND (
        a.venue_types IS NULL
        OR a.venue_types = '[]'::jsonb
        OR a.venue_types = '["UNKNOWN"]'::jsonb
      );
