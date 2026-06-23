CREATE TABLE IF NOT EXISTS matrice_pouvoirs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    entity_type         VARCHAR(30) NOT NULL,
    seuil_min           NUMERIC(18, 4),
    seuil_max           NUMERIC(18, 4),
    approbateur_role    VARCHAR(100) NOT NULL,
    label               VARCHAR(255) NOT NULL,
    ordre               INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matrice_pouvoirs_tenant_entity
    ON matrice_pouvoirs(tenant_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_matrice_pouvoirs_tenant_entity_ordre
    ON matrice_pouvoirs(tenant_id, entity_type, ordre);
