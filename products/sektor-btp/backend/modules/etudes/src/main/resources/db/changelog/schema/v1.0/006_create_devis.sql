CREATE TABLE IF NOT EXISTS devis (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    version                 INTEGER NOT NULL DEFAULT 1,
    client_id               VARCHAR(100) NOT NULL,
    client_name             VARCHAR(255),
    contact_client          VARCHAR(255),
    objet                   VARCHAR(500) NOT NULL,
    ville                   VARCHAR(255),
    date_emission           DATE NOT NULL,
    date_validite           DATE NOT NULL,
    metre_id                UUID REFERENCES metrees(id) ON DELETE SET NULL,
    dpgf_id                 UUID REFERENCES dpgf(id) ON DELETE SET NULL,
    bibliotheque_reference  VARCHAR(255),
    conditions_paiement     VARCHAR(500) NOT NULL,
    delai_execution_jours   INTEGER,
    total_ht                NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tva_taux                NUMERIC(8, 4) NOT NULL DEFAULT 20,
    total_tva               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_ttc               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    remise_globale_percent  NUMERIC(8, 4),
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    motif_refus             TEXT,
    chantier_genere_id      VARCHAR(100),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_devis_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_devis_tenant_status
    ON devis(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_devis_tenant_client
    ON devis(tenant_id, client_id);

CREATE INDEX IF NOT EXISTS idx_devis_tenant_dpgf
    ON devis(tenant_id, dpgf_id);

CREATE TABLE IF NOT EXISTS devis_lignes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    devis_id            UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
    ordre               INTEGER NOT NULL DEFAULT 0,
    parent_ligne_id     UUID REFERENCES devis_lignes(id) ON DELETE SET NULL,
    type                VARCHAR(20) NOT NULL,
    code                VARCHAR(50),
    designation         VARCHAR(500) NOT NULL,
    ouvrage_id          UUID REFERENCES ouvrages(id) ON DELETE SET NULL,
    unite               VARCHAR(30),
    quantite            NUMERIC(18, 4),
    prix_unitaire_ht    NUMERIC(18, 4),
    total_ht            NUMERIC(18, 4),
    remise_percent      NUMERIC(8, 4),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devis_lignes_devis
    ON devis_lignes(devis_id);

CREATE TABLE IF NOT EXISTS devis_versions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    devis_id        UUID NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
    version         INTEGER NOT NULL,
    snapshot_date   DATE NOT NULL,
    total_ht        NUMERIC(18, 4) NOT NULL DEFAULT 0,
    modifications   TEXT NOT NULL,
    url             VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devis_versions_devis
    ON devis_versions(devis_id);
