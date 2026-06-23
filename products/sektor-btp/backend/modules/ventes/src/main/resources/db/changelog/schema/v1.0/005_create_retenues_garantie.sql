CREATE TABLE IF NOT EXISTS retenues_garantie (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    marche_id           VARCHAR(100) NOT NULL,
    client_id           VARCHAR(100) NOT NULL,
    facture_id          VARCHAR(100),
    montant_retenu      NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cumul               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    montant_restitue    NUMERIC(18, 4) NOT NULL DEFAULT 0,
    statut              VARCHAR(30) NOT NULL DEFAULT 'IMMOBILISEE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_retenues_garantie_tenant_marche UNIQUE (tenant_id, marche_id)
);

CREATE INDEX IF NOT EXISTS idx_retenues_garantie_tenant_statut
    ON retenues_garantie(tenant_id, statut);

CREATE INDEX IF NOT EXISTS idx_retenues_garantie_tenant_client
    ON retenues_garantie(tenant_id, client_id);

CREATE INDEX IF NOT EXISTS idx_retenues_garantie_tenant_marche
    ON retenues_garantie(tenant_id, marche_id);
