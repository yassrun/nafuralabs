-- Retire composite RESTO_BAR → multi-types RESTAURANT + BAR (primary = RESTAURANT when RESTO_BAR was present).

DO $$
DECLARE
    r RECORD;
    elem text;
    out_types text[] := ARRAY[]::text[];
    has_resto_bar boolean;
BEGIN
    FOR r IN
        SELECT id, venue_types
        FROM catalog_place_ai_enrichments
        WHERE venue_types @> '"RESTO_BAR"'::jsonb
    LOOP
        out_types := ARRAY[]::text[];
        has_resto_bar := false;

        FOR elem IN
            SELECT jsonb_array_elements_text(r.venue_types)
        LOOP
            IF elem = 'RESTO_BAR' THEN
                has_resto_bar := true;
                IF NOT ('RESTAURANT' = ANY (out_types)) THEN
                    out_types := array_append(out_types, 'RESTAURANT');
                END IF;
                IF NOT ('BAR' = ANY (out_types)) THEN
                    out_types := array_append(out_types, 'BAR');
                END IF;
            ELSIF NOT (elem = ANY (out_types)) THEN
                out_types := array_append(out_types, elem);
            END IF;
        END LOOP;

        -- Ensure RESTAURANT is primary when RESTO_BAR was the composite format
        IF has_resto_bar AND 'RESTAURANT' = ANY (out_types) AND out_types[1] IS DISTINCT FROM 'RESTAURANT' THEN
            out_types := array_prepend(
                'RESTAURANT',
                array_remove(out_types, 'RESTAURANT')
            );
        END IF;

        UPDATE catalog_place_ai_enrichments
        SET venue_types = to_jsonb(out_types),
            updated_at = NOW()
        WHERE id = r.id;
    END LOOP;
END $$;
