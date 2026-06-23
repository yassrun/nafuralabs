-- Scope module: backfill default scopes from legacy tenant default rows when present.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'tenant'
    ) THEN
        INSERT INTO app_scope (id, scope_key, name, type, application_id, created_at, updated_at)
        SELECT
            t.id,
            t.key,
            COALESCE(NULLIF(t.name, ''), t.application_id || ' Default Scope'),
            'APP_DEFAULT',
            t.application_id,
            COALESCE(t.created_at, CURRENT_TIMESTAMP),
            COALESCE(t.updated_at, CURRENT_TIMESTAMP)
        FROM tenant t
        WHERE t.key LIKE 'default-%'
          AND t.application_id IS NOT NULL
          AND NOT EXISTS (
              SELECT 1
              FROM app_scope s
              WHERE s.id = t.id
          );
    END IF;
END $$;
