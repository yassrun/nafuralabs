CREATE TABLE IF NOT EXISTS ouvrages (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    code                    VARCHAR(50) NOT NULL,
    designation             VARCHAR(500) NOT NULL,
    category                VARCHAR(30) NOT NULL,
    unite                   VARCHAR(30) NOT NULL,
    prix_unitaire_ht        NUMERIC(18, 4) NOT NULL DEFAULT 0,
    sous_total_debourse     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    mo_heures               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    mo_taux_horaire         NUMERIC(18, 4) NOT NULL DEFAULT 0,
    mo_total                NUMERIC(18, 4) NOT NULL DEFAULT 0,
    frais_generaux_percent  NUMERIC(8, 4) NOT NULL DEFAULT 8,
    benefice_percent        NUMERIC(8, 4) NOT NULL DEFAULT 7,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    notes                   TEXT,
    derniere_maj            DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ouvrages_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_ouvrages_tenant_category
    ON ouvrages(tenant_id, category);

CREATE INDEX IF NOT EXISTS idx_ouvrages_tenant_active
    ON ouvrages(tenant_id, is_active);

CREATE TABLE IF NOT EXISTS composants_ouvrage (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    ouvrage_id          UUID NOT NULL REFERENCES ouvrages(id) ON DELETE CASCADE,
    type                VARCHAR(30) NOT NULL,
    article_id          VARCHAR(100),
    designation         VARCHAR(500) NOT NULL,
    unite               VARCHAR(30) NOT NULL,
    rendement           NUMERIC(18, 4) NOT NULL DEFAULT 0,
    prix_unitaire       NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_composants_ouvrage_ouvrage
    ON composants_ouvrage(ouvrage_id);
