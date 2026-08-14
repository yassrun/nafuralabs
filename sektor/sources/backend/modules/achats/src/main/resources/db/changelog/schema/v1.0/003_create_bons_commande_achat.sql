CREATE TABLE IF NOT EXISTS bons_commande_achat (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    fournisseur_id          VARCHAR(100) NOT NULL,
    fournisseur_name        VARCHAR(255),
    chantier_id             VARCHAR(100),
    chantier_code           VARCHAR(50),
    chantier_name           VARCHAR(255),
    da_id                   VARCHAR(100),
    da_numero               VARCHAR(50),
    ao_id                   VARCHAR(100),
    ao_numero               VARCHAR(50),
    contrat_id              VARCHAR(100),
    contrat_numero          VARCHAR(50),
    rubrique                VARCHAR(50),
    date_creation           DATE NOT NULL,
    date_livraison_prevue   DATE NOT NULL,
    conditions_paiement     VARCHAR(255) NOT NULL,
    mode_reglement          VARCHAR(30),
    total_ht                NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tva_taux                NUMERIC(8, 4) NOT NULL DEFAULT 20,
    total_ttc               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    validateur_id           VARCHAR(100),
    validateur_name         VARCHAR(255),
    validation_date         DATE,
    total_livre_ht          NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_facture_ht        NUMERIC(18, 4) NOT NULL DEFAULT 0,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_bons_commande_achat_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_bons_commande_achat_tenant_status
    ON bons_commande_achat(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_bons_commande_achat_tenant_fournisseur
    ON bons_commande_achat(tenant_id, fournisseur_id);

CREATE INDEX IF NOT EXISTS idx_bons_commande_achat_tenant_chantier
    ON bons_commande_achat(tenant_id, chantier_id);

CREATE TABLE IF NOT EXISTS bons_commande_achat_lignes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    bon_commande_achat_id   UUID NOT NULL REFERENCES bons_commande_achat(id) ON DELETE CASCADE,
    article_id              VARCHAR(100) NOT NULL,
    article_code            VARCHAR(50),
    article_name            VARCHAR(255),
    quantite                NUMERIC(18, 4) NOT NULL,
    quantite_livree         NUMERIC(18, 4) NOT NULL DEFAULT 0,
    quantite_facturee       NUMERIC(18, 4) NOT NULL DEFAULT 0,
    uom_code                VARCHAR(30),
    prix_unitaire_ht        NUMERIC(18, 4) NOT NULL,
    total_ht                NUMERIC(18, 4) NOT NULL,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bons_commande_achat_lignes_bc
    ON bons_commande_achat_lignes(bon_commande_achat_id);
