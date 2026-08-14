CREATE TABLE IF NOT EXISTS chantier_lots (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    chantier_id         VARCHAR(100) NOT NULL,
    code                VARCHAR(50) NOT NULL,
    designation         VARCHAR(500) NOT NULL,
    parent_lot_id       VARCHAR(100),
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
    CONSTRAINT uq_chantier_lots_tenant_chantier_code UNIQUE (tenant_id, chantier_id, code)
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
    unite               VARCHAR(30),
    quantite            NUMERIC(18, 4),
    prix_unitaire_ht    NUMERIC(18, 4),
    montant_ht          NUMERIC(18, 4),
    ordre               INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_postes_budgetaires_lot FOREIGN KEY (lot_id) REFERENCES chantier_lots (id),
    CONSTRAINT uq_postes_budgetaires_tenant_lot_code UNIQUE (tenant_id, lot_id, code)
);

CREATE INDEX IF NOT EXISTS idx_postes_budgetaires_tenant_lot
    ON postes_budgetaires (tenant_id, lot_id);
