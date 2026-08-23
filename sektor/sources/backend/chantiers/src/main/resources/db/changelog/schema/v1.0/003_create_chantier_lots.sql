CREATE TABLE IF NOT EXISTS chantier_lots (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    chantier_id         VARCHAR(100) NOT NULL,
    code                VARCHAR(50) NOT NULL,
    designation         VARCHAR(500) NOT NULL,
    parent_lot_id       VARCHAR(100),
    -- Nature de la ligne : VENDU (copiée du devis validé) ou INTERNE (ajoutée au chantier).
    nature              VARCHAR(20) NOT NULL,
    -- Lien retour vers le noeud DPGF d'origine, posé a la copie. NULL pour une ligne interne.
    dpgf_noeud_id       UUID,
    unite               VARCHAR(30),
    quantite            NUMERIC(18, 4),
    prix_unitaire_ht    NUMERIC(18, 4),
    montant_ht          NUMERIC(18, 4),
    avancement_percent  NUMERIC(8, 4) NOT NULL DEFAULT 0,
    ordre               INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_chantier_lots_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id),
    CONSTRAINT fk_chantier_lots_parent FOREIGN KEY (parent_lot_id) REFERENCES chantier_lots (id),
    CONSTRAINT uq_chantier_lots_tenant_chantier_code UNIQUE (tenant_id, chantier_id, code),
    CONSTRAINT ck_chantier_lots_nature CHECK (nature IN ('VENDU', 'INTERNE')),
    -- Un vendu garde son origine ; un interne n'en a pas.
    CONSTRAINT ck_chantier_lots_origine CHECK (
        (nature = 'VENDU' AND dpgf_noeud_id IS NOT NULL)
        OR (nature = 'INTERNE' AND dpgf_noeud_id IS NULL)
    ),
    -- Un interne ne porte pas de prix de vente.
    CONSTRAINT ck_chantier_lots_interne_sans_vente CHECK (
        nature <> 'INTERNE' OR (prix_unitaire_ht IS NULL AND montant_ht IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_chantier_lots_tenant_chantier
    ON chantier_lots (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_chantier_lots_parent
    ON chantier_lots (parent_lot_id);

CREATE TABLE IF NOT EXISTS postes_budgetaires (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    lot_id              VARCHAR(100) NOT NULL,
    code                VARCHAR(50) NOT NULL,
    designation         VARCHAR(500) NOT NULL,
    -- Nature de la ligne : VENDU (copiée du devis validé) ou INTERNE (ajoutée au chantier).
    nature              VARCHAR(20) NOT NULL,
    -- Lien retour vers le noeud DPGF d'origine, posé a la copie. NULL pour une ligne interne.
    dpgf_noeud_id       UUID,
    unite               VARCHAR(30),
    quantite            NUMERIC(18, 4),
    prix_unitaire_ht    NUMERIC(18, 4),
    montant_ht          NUMERIC(18, 4),
    ordre               INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_postes_budgetaires_lot FOREIGN KEY (lot_id) REFERENCES chantier_lots (id),
    CONSTRAINT uq_postes_budgetaires_tenant_lot_code UNIQUE (tenant_id, lot_id, code),
    CONSTRAINT ck_postes_budgetaires_nature CHECK (nature IN ('VENDU', 'INTERNE')),
    CONSTRAINT ck_postes_budgetaires_origine CHECK (
        (nature = 'VENDU' AND dpgf_noeud_id IS NOT NULL)
        OR (nature = 'INTERNE' AND dpgf_noeud_id IS NULL)
    ),
    CONSTRAINT ck_postes_budgetaires_interne_sans_vente CHECK (
        nature <> 'INTERNE' OR (prix_unitaire_ht IS NULL AND montant_ht IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_postes_budgetaires_tenant_lot
    ON postes_budgetaires (tenant_id, lot_id);

CREATE INDEX IF NOT EXISTS idx_chantier_lots_dpgf_noeud
    ON chantier_lots (dpgf_noeud_id);

CREATE INDEX IF NOT EXISTS idx_postes_budgetaires_dpgf_noeud
    ON postes_budgetaires (dpgf_noeud_id);
