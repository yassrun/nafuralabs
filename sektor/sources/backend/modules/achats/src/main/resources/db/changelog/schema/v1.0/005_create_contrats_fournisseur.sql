CREATE TABLE IF NOT EXISTS contrats_fournisseur (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    type                    VARCHAR(30) NOT NULL DEFAULT 'FOURNISSEUR',
    fournisseur_id          VARCHAR(100) NOT NULL,
    chantier_id             VARCHAR(100),
    date_debut              DATE NOT NULL,
    date_fin                DATE NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    montant_ht              NUMERIC(18, 4),
    art187_declare          BOOLEAN NOT NULL DEFAULT false,
    art187_valide_moa       BOOLEAN NOT NULL DEFAULT false,
    retenue_garantie_taux   NUMERIC(8, 4),
    paiement_direct_moa     BOOLEAN NOT NULL DEFAULT false,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_contrats_fournisseur_tenant_numero UNIQUE (tenant_id, numero),
    CONSTRAINT chk_contrats_fournisseur_type CHECK (type IN ('FOURNISSEUR', 'SOUS_TRAITANCE'))
);

CREATE INDEX IF NOT EXISTS idx_contrats_fournisseur_tenant_status
    ON contrats_fournisseur(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_contrats_fournisseur_tenant_type
    ON contrats_fournisseur(tenant_id, type);

CREATE INDEX IF NOT EXISTS idx_contrats_fournisseur_tenant_fournisseur
    ON contrats_fournisseur(tenant_id, fournisseur_id);

CREATE INDEX IF NOT EXISTS idx_contrats_fournisseur_tenant_chantier
    ON contrats_fournisseur(tenant_id, chantier_id);
