CREATE TABLE IF NOT EXISTS avoirs_client (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    numero                      VARCHAR(50) NOT NULL,
    facture_originale_id        VARCHAR(100) NOT NULL,
    facture_originale_numero    VARCHAR(50),
    client_id                   VARCHAR(100) NOT NULL,
    client_name                 VARCHAR(255),
    date_emission               DATE NOT NULL,
    motif                       VARCHAR(500) NOT NULL,
    total_ht                    NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tva_taux                    NUMERIC(8, 4) NOT NULL DEFAULT 20,
    total_tva                   NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_ttc                   NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status                      VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_avoirs_client_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_avoirs_client_tenant_status
    ON avoirs_client(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_avoirs_client_tenant_client
    ON avoirs_client(tenant_id, client_id);

CREATE INDEX IF NOT EXISTS idx_avoirs_client_tenant_facture
    ON avoirs_client(tenant_id, facture_originale_id);

CREATE TABLE IF NOT EXISTS avoirs_client_lignes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    avoir_id            UUID NOT NULL REFERENCES avoirs_client(id) ON DELETE CASCADE,
    ordre               INTEGER NOT NULL DEFAULT 1,
    designation         VARCHAR(500) NOT NULL,
    total_ht            NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_avoirs_client_lignes_avoir
    ON avoirs_client_lignes(avoir_id);
