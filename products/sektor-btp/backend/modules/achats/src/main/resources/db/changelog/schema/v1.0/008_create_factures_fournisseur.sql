CREATE TABLE IF NOT EXISTS factures_fournisseur (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    numero_interne          VARCHAR(50) NOT NULL,
    numero_fournisseur      VARCHAR(100),
    fournisseur_id          VARCHAR(100) NOT NULL,
    fournisseur_name        VARCHAR(255),
    bc_id                   UUID REFERENCES bons_commande_achat(id) ON DELETE SET NULL,
    bc_numero               VARCHAR(50),
    reception_id            VARCHAR(100),
    reception_numero        VARCHAR(255),
    chantier_id             VARCHAR(100),
    chantier_name           VARCHAR(255),
    rubrique                VARCHAR(50),
    date_facture            DATE NOT NULL,
    date_reception          DATE,
    date_echeance           DATE NOT NULL,
    total_ht                NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_tva               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_ttc               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    net_a_payer_ttc         NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cumul_regle_ttc         NUMERIC(18, 4) NOT NULL DEFAULT 0,
    reste_a_regler          NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    matching_status         VARCHAR(30),
    notes                   TEXT,
    motif_litige            TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_factures_fournisseur_tenant_numero UNIQUE (tenant_id, numero_interne)
);

CREATE INDEX IF NOT EXISTS idx_factures_fournisseur_tenant_bc
    ON factures_fournisseur(tenant_id, bc_id);

CREATE INDEX IF NOT EXISTS idx_factures_fournisseur_tenant_status
    ON factures_fournisseur(tenant_id, status);

CREATE TABLE IF NOT EXISTS factures_fournisseur_lignes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    facture_fournisseur_id  UUID NOT NULL REFERENCES factures_fournisseur(id) ON DELETE CASCADE,
    ordre                   INTEGER NOT NULL DEFAULT 1,
    designation             VARCHAR(500) NOT NULL,
    bc_ligne_id             UUID REFERENCES bons_commande_achat_lignes(id) ON DELETE SET NULL,
    compte_code             VARCHAR(20) NOT NULL,
    axe_analytique          VARCHAR(100),
    axe_analytique_libelle  VARCHAR(255),
    quantite                NUMERIC(18, 4),
    prix_unitaire_ht        NUMERIC(18, 4),
    total_ht                NUMERIC(18, 4) NOT NULL,
    tva_taux                NUMERIC(8, 4) NOT NULL DEFAULT 20,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_factures_fournisseur_lignes_ff
    ON factures_fournisseur_lignes(facture_fournisseur_id);
