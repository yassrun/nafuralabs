CREATE TABLE IF NOT EXISTS situations_travaux (
    id                          VARCHAR(100) PRIMARY KEY,
    tenant_id                   UUID NOT NULL,
    chantier_id                 VARCHAR(100) NOT NULL,
    numero                      VARCHAR(50) NOT NULL,
    numero_ordre                INTEGER NOT NULL,
    date_periode_debut          DATE NOT NULL,
    date_periode_fin            DATE NOT NULL,
    date_emission               DATE NOT NULL,
    cumul_precedent_ht          NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cumul_courant_ht            NUMERIC(18, 4) NOT NULL DEFAULT 0,
    travaux_periode_ht          NUMERIC(18, 4) NOT NULL DEFAULT 0,
    retenue_garantie_percent    NUMERIC(8, 4) NOT NULL DEFAULT 0,
    retenue_garantie_montant    NUMERIC(18, 4) NOT NULL DEFAULT 0,
    retenue_avance_percent      NUMERIC(8, 4),
    retenue_avance_montant      NUMERIC(18, 4),
    net_a_payer_ht              NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tva_taux                    NUMERIC(8, 4) NOT NULL DEFAULT 20,
    net_a_payer_ttc             NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status                      VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    facture_id                  VARCHAR(100),
    approbateur_moa_name        VARCHAR(200),
    approbation_date            DATE,
    motif_rejet                 VARCHAR(2000),
    notes                       VARCHAR(2000),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_situations_travaux_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id),
    CONSTRAINT uq_situations_travaux_tenant_chantier_ordre UNIQUE (tenant_id, chantier_id, numero_ordre)
);

CREATE INDEX IF NOT EXISTS idx_situations_travaux_tenant_chantier
    ON situations_travaux (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_situations_travaux_tenant_status
    ON situations_travaux (tenant_id, status);

CREATE TABLE IF NOT EXISTS situation_lignes (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    situation_id            VARCHAR(100) NOT NULL,
    lot_id                  VARCHAR(100),
    poste_budgetaire_id     VARCHAR(100),
    designation             VARCHAR(500) NOT NULL,
    unite                   VARCHAR(30),
    quantite_totale         NUMERIC(18, 4),
    quantite_precedente     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    quantite_cumulee        NUMERIC(18, 4) NOT NULL DEFAULT 0,
    prix_unitaire           NUMERIC(18, 4) NOT NULL DEFAULT 0,
    montant_ht              NUMERIC(18, 4) NOT NULL DEFAULT 0,
    ordre                   INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_situation_lignes_situation FOREIGN KEY (situation_id) REFERENCES situations_travaux (id),
    CONSTRAINT fk_situation_lignes_lot FOREIGN KEY (lot_id) REFERENCES chantier_lots (id),
    CONSTRAINT fk_situation_lignes_poste FOREIGN KEY (poste_budgetaire_id) REFERENCES postes_budgetaires (id)
);

CREATE INDEX IF NOT EXISTS idx_situation_lignes_tenant_situation
    ON situation_lignes (tenant_id, situation_id);

CREATE INDEX IF NOT EXISTS idx_situation_lignes_tenant_lot
    ON situation_lignes (tenant_id, lot_id);
