-- Liquibase order: renumbered from 006_create_avancements_physiques.sql after budget took 006.
CREATE TABLE IF NOT EXISTS avancements_physiques (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    chantier_id         VARCHAR(100) NOT NULL,
    lot_id              VARCHAR(100),
    poste_id            VARCHAR(100),
    date_saisie         DATE NOT NULL,
    quantite_realisee   NUMERIC(18, 4) NOT NULL DEFAULT 0,
    pourcentage         NUMERIC(8, 4) NOT NULL DEFAULT 0,
    notes               VARCHAR(2000),
    status              VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    saisie_par_id       VARCHAR(100),
    saisie_par_name     VARCHAR(200),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_avancements_physiques_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id),
    CONSTRAINT fk_avancements_physiques_lot FOREIGN KEY (lot_id) REFERENCES chantier_lots (id),
    CONSTRAINT fk_avancements_physiques_poste FOREIGN KEY (poste_id) REFERENCES postes_budgetaires (id)
);

CREATE INDEX IF NOT EXISTS idx_avancements_physiques_tenant_chantier
    ON avancements_physiques (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_avancements_physiques_tenant_lot
    ON avancements_physiques (tenant_id, lot_id);

CREATE INDEX IF NOT EXISTS idx_avancements_physiques_tenant_poste
    ON avancements_physiques (tenant_id, poste_id);

CREATE INDEX IF NOT EXISTS idx_avancements_physiques_tenant_date
    ON avancements_physiques (tenant_id, date_saisie DESC);
