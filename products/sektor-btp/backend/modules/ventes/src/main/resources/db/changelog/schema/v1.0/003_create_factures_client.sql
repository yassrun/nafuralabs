CREATE TABLE IF NOT EXISTS factures_client (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    type                    VARCHAR(30) NOT NULL DEFAULT 'DIVERSE',
    client_id               VARCHAR(100) NOT NULL,
    client_name             VARCHAR(255),
    bcc_id                  VARCHAR(100),
    chantier_id             VARCHAR(100),
    chantier_code           VARCHAR(50),
    date_emission           DATE NOT NULL,
    date_echeance           DATE NOT NULL,
    mode_paiement           VARCHAR(30),
    total_ht                NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tva_taux                NUMERIC(8, 4) NOT NULL DEFAULT 20,
    total_tva               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    net_a_payer_ttc         NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cumul_encaisse_ttc      NUMERIC(18, 4) NOT NULL DEFAULT 0,
    reste_ttc               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_factures_client_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_factures_client_tenant_status
    ON factures_client(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_factures_client_tenant_client
    ON factures_client(tenant_id, client_id);

CREATE TABLE IF NOT EXISTS factures_client_lignes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    facture_id          UUID NOT NULL REFERENCES factures_client(id) ON DELETE CASCADE,
    ordre               INTEGER NOT NULL DEFAULT 1,
    designation         VARCHAR(500) NOT NULL,
    unite               VARCHAR(30),
    quantite            NUMERIC(18, 4),
    prix_unitaire_ht    NUMERIC(18, 4),
    total_ht            NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_factures_client_lignes_facture
    ON factures_client_lignes(facture_id);
