-- Taxonomy v2 facets: settings / offers / experiences / suitable_for

ALTER TABLE catalog_place_ai_enrichments
    ADD COLUMN IF NOT EXISTS settings JSONB,
    ADD COLUMN IF NOT EXISTS offers JSONB,
    ADD COLUMN IF NOT EXISTS experiences JSONB,
    ADD COLUMN IF NOT EXISTS suitable_for JSONB;

-- Migrate legacy activities → offers / experiences
UPDATE catalog_place_ai_enrichments
SET
    offers = COALESCE(
        (
            SELECT jsonb_agg(DISTINCT mapped)
            FROM jsonb_array_elements_text(COALESCE(activities, '[]'::jsonb)) AS t(val)
            CROSS JOIN LATERAL (
                SELECT CASE upper(val)
                    WHEN 'DINE' THEN 'FOOD'
                    WHEN 'DRINK_ALCOHOL' THEN 'ALCOHOL'
                    WHEN 'COFFEE_TEA' THEN 'COFFEE_TEA'
                    WHEN 'BRUNCH' THEN 'BRUNCH'
                    WHEN 'BREAKFAST' THEN 'BREAKFAST'
                    WHEN 'PASTRY_DESSERT' THEN 'PASTRY_DESSERT'
                    WHEN 'FOOD' THEN 'FOOD'
                    WHEN 'ALCOHOL' THEN 'ALCOHOL'
                    WHEN 'SHISHA' THEN 'SHISHA'
                    ELSE NULL
                END AS mapped
            ) m
            WHERE mapped IS NOT NULL
        ),
        '[]'::jsonb
    ),
    experiences = COALESCE(
        (
            SELECT jsonb_agg(DISTINCT mapped)
            FROM (
                SELECT CASE upper(val)
                    WHEN 'DANCE' THEN 'DANCE'
                    WHEN 'LIVE_MUSIC' THEN 'LIVE_MUSIC'
                    WHEN 'DJ' THEN 'DJ'
                    WHEN 'WATCH_SHOW' THEN 'WATCH_SHOW'
                    WHEN 'WATCH_SPORTS' THEN 'WATCH_SPORTS'
                    WHEN 'WORKSHOP' THEN 'WORKSHOP'
                    WHEN 'KARAOKE' THEN 'KARAOKE'
                    WHEN 'GAMES' THEN 'GAMES'
                    WHEN 'POOL_ACCESS' THEN 'POOL_ACCESS'
                    ELSE NULL
                END AS mapped
                FROM jsonb_array_elements_text(COALESCE(activities, '[]'::jsonb)) AS t(val)
                UNION
                SELECT upper(val) AS mapped
                FROM jsonb_array_elements_text(COALESCE(experience_tags, '[]'::jsonb)) AS t(val)
                WHERE upper(val) IN (
                    'DANCE','LIVE_MUSIC','DJ','WATCH_SHOW','WATCH_SPORTS',
                    'WORKSHOP','KARAOKE','GAMES','POOL_ACCESS'
                )
            ) x
            WHERE mapped IS NOT NULL
        ),
        '[]'::jsonb
    ),
    suitable_for = COALESCE(
        (
            SELECT jsonb_agg(DISTINCT upper(val))
            FROM jsonb_array_elements_text(COALESCE(audience_tags, '[]'::jsonb)) AS t(val)
            WHERE upper(val) IN (
                'WORK_STUDY','BUSINESS_MEETING','DATE','FAMILY',
                'FRIENDS_GROUP','CELEBRATION','NETWORKING','PRIVATE_EVENT'
            )
        ),
        '[]'::jsonb
    ),
    settings = COALESCE(settings, '[]'::jsonb),
    taxonomy_version = 'venue-ma-v2',
    updated_at = NOW()
WHERE activities IS NOT NULL
   OR experience_tags IS NOT NULL
   OR audience_tags IS NOT NULL
   OR offers IS NULL;

-- Denormalize activities = offers ∪ experiences for legacy list filters
UPDATE catalog_place_ai_enrichments
SET activities = COALESCE(
    (
        SELECT jsonb_agg(DISTINCT v)
        FROM (
            SELECT jsonb_array_elements_text(COALESCE(offers, '[]'::jsonb)) AS v
            UNION
            SELECT jsonb_array_elements_text(COALESCE(experiences, '[]'::jsonb)) AS v
        ) u
    ),
    '[]'::jsonb
),
experience_tags = COALESCE(experiences, '[]'::jsonb),
audience_tags = COALESCE(suitable_for, '[]'::jsonb),
updated_at = NOW();

CREATE INDEX IF NOT EXISTS idx_catalog_place_ai_enrichments_settings
    ON catalog_place_ai_enrichments USING GIN (settings);
CREATE INDEX IF NOT EXISTS idx_catalog_place_ai_enrichments_offers
    ON catalog_place_ai_enrichments USING GIN (offers);
CREATE INDEX IF NOT EXISTS idx_catalog_place_ai_enrichments_experiences
    ON catalog_place_ai_enrichments USING GIN (experiences);
CREATE INDEX IF NOT EXISTS idx_catalog_place_ai_enrichments_suitable_for
    ON catalog_place_ai_enrichments USING GIN (suitable_for);
