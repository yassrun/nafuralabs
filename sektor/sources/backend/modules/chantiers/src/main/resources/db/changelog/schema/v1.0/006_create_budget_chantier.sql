-- Liquibase order: renumbered from 005_create_budget_chantier.sql (duplicate 005 prefix with phases).
CREATE TABLE IF NOT EXISTS budget_chantiers (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    chantier_id         VARCHAR(100) NOT NULL,
    previsionnel_ht     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    revise_ht           NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_budget_chantiers_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id),
    CONSTRAINT uq_budget_chantiers_tenant_chantier UNIQUE (tenant_id, chantier_id)
);

CREATE INDEX IF NOT EXISTS idx_budget_chantiers_tenant_chantier
    ON budget_chantiers (tenant_id, chantier_id);

CREATE TABLE IF NOT EXISTS budget_lignes (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    budget_chantier_id  VARCHAR(100) NOT NULL,
    rubrique            VARCHAR(30) NOT NULL,
    label               VARCHAR(255) NOT NULL,
    lot                 VARCHAR(100),
    previsionnel_ht     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    revise_ht           NUMERIC(18, 4) NOT NULL DEFAULT 0,
    engage_ht           NUMERIC(18, 4) NOT NULL DEFAULT 0,
    realise_ht          NUMERIC(18, 4) NOT NULL DEFAULT 0,
    poste_budgetaire_id VARCHAR(100),
    ordre               INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_budget_lignes_budget FOREIGN KEY (budget_chantier_id) REFERENCES budget_chantiers (id),
    CONSTRAINT fk_budget_lignes_poste FOREIGN KEY (poste_budgetaire_id) REFERENCES postes_budgetaires (id),
    CONSTRAINT uq_budget_lignes_tenant_budget_rubrique UNIQUE (tenant_id, budget_chantier_id, rubrique)
);

CREATE INDEX IF NOT EXISTS idx_budget_lignes_tenant_budget
    ON budget_lignes (tenant_id, budget_chantier_id);
