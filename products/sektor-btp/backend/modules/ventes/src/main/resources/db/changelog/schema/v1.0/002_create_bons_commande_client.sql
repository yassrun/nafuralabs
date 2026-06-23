CREATE TABLE IF NOT EXISTS bons_commande_client (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    numero              VARCHAR(50) NOT NULL,
    numero_client       VARCHAR(100) NOT NULL,
    client_id           VARCHAR(100) NOT NULL,
    client_name         VARCHAR(255),
    chantier_id         VARCHAR(100),
    chantier_code       VARCHAR(50),
    date_reception      DATE NOT NULL,
    date_fin_prevue     DATE,
    montant_ht          NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tva_taux            NUMERIC(8, 4) NOT NULL DEFAULT 20,
    montant_ttc         NUMERIC(18, 4) NOT NULL DEFAULT 0,
    montant_facture_ht  NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status              VARCHAR(30) NOT NULL DEFAULT 'RECU',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_bons_commande_client_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_bons_commande_client_tenant_status
    ON bons_commande_client(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_bons_commande_client_tenant_client
    ON bons_commande_client(tenant_id, client_id);

CREATE TABLE IF NOT EXISTS bons_commande_client_lignes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    bcc_id              UUID NOT NULL REFERENCES bons_commande_client(id) ON DELETE CASCADE,
    ordre               INTEGER NOT NULL DEFAULT 1,
    designation         VARCHAR(500) NOT NULL,
    unite               VARCHAR(30),
    quantite            NUMERIC(18, 4),
    prix_unitaire_ht    NUMERIC(18, 4),
    total_ht            NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bons_commande_client_lignes_bcc
    ON bons_commande_client_lignes(bcc_id);
