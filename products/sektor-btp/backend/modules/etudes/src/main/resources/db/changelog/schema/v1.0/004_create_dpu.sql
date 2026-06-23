CREATE TABLE IF NOT EXISTS prix_dpu (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    ouvrage_id                  UUID NOT NULL REFERENCES ouvrages(id) ON DELETE CASCADE,
    debours_sec                 NUMERIC(18, 4) NOT NULL DEFAULT 0,
    frais_generaux_percent      NUMERIC(8, 4) NOT NULL DEFAULT 8,
    marge_beneficiaire_percent  NUMERIC(8, 4) NOT NULL DEFAULT 7,
    prix_vente_ht               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    prix_vente_ttc              NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tva_taux                    NUMERIC(8, 4) NOT NULL DEFAULT 20,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_prix_dpu_tenant_ouvrage UNIQUE (tenant_id, ouvrage_id)
);

CREATE INDEX IF NOT EXISTS idx_prix_dpu_tenant_ouvrage
    ON prix_dpu(tenant_id, ouvrage_id);

CREATE TABLE IF NOT EXISTS composants_dpu (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    prix_dpu_id         UUID NOT NULL REFERENCES prix_dpu(id) ON DELETE CASCADE,
    type                VARCHAR(30) NOT NULL,
    article_ou_poste_id VARCHAR(100) NOT NULL,
    quantite            NUMERIC(18, 4) NOT NULL DEFAULT 0,
    unite               VARCHAR(30) NOT NULL,
    prix_unitaire       NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    ordre               INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_composants_dpu_prix_dpu
    ON composants_dpu(prix_dpu_id);

CREATE TABLE IF NOT EXISTS dpu_versions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    prix_dpu_id             UUID NOT NULL REFERENCES prix_dpu(id) ON DELETE CASCADE,
    saved_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    frais_generaux_percent  NUMERIC(8, 4) NOT NULL,
    marge_percent           NUMERIC(8, 4) NOT NULL,
    prix_vente_ht           NUMERIC(18, 4) NOT NULL,
    snapshot_json           JSONB NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dpu_versions_prix_dpu
    ON dpu_versions(prix_dpu_id, saved_at DESC);
