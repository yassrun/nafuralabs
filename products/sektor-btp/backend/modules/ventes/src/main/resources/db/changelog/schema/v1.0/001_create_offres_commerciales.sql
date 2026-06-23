CREATE TABLE IF NOT EXISTS offres_commerciales (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    numero              VARCHAR(50) NOT NULL,
    client_id           VARCHAR(100) NOT NULL,
    client_name         VARCHAR(255),
    chantier_id         VARCHAR(100),
    chantier_code       VARCHAR(50),
    date_emission       DATE NOT NULL,
    date_validite       DATE NOT NULL,
    objet               VARCHAR(500) NOT NULL,
    total_ht            NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tva_taux            NUMERIC(8, 4) NOT NULL DEFAULT 20,
    total_tva           NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_ttc           NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status              VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    motif_refus         TEXT,
    notes               TEXT,
    bcc_id              VARCHAR(100),
    bcc_numero          VARCHAR(50),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_offres_commerciales_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_offres_commerciales_tenant_status
    ON offres_commerciales(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_offres_commerciales_tenant_client
    ON offres_commerciales(tenant_id, client_id);

CREATE TABLE IF NOT EXISTS offres_commerciales_lignes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    offre_id            UUID NOT NULL REFERENCES offres_commerciales(id) ON DELETE CASCADE,
    ordre               INTEGER NOT NULL DEFAULT 1,
    designation         VARCHAR(500) NOT NULL,
    unite               VARCHAR(30),
    quantite            NUMERIC(18, 4),
    prix_unitaire_ht    NUMERIC(18, 4),
    total_ht            NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offres_commerciales_lignes_offre
    ON offres_commerciales_lignes(offre_id);
