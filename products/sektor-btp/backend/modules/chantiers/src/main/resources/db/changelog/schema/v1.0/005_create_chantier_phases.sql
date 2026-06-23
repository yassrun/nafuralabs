CREATE TABLE IF NOT EXISTS chantier_phases (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    chantier_id         VARCHAR(100) NOT NULL,
    lot_id              VARCHAR(100),
    code                VARCHAR(50) NOT NULL,
    designation         VARCHAR(500) NOT NULL,
    date_debut          DATE NOT NULL,
    date_fin            DATE NOT NULL,
    dependances         VARCHAR(2000),
    responsable_id      VARCHAR(100),
    responsable_name    VARCHAR(200),
    equipe_name         VARCHAR(200),
    quantite            NUMERIC(18, 4),
    unite               VARCHAR(30),
    avancement_percent  NUMERIC(8, 4) NOT NULL DEFAULT 0,
    status              VARCHAR(30) NOT NULL DEFAULT 'PLANIFIE',
    ordre               INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_chantier_phases_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id),
    CONSTRAINT fk_chantier_phases_lot FOREIGN KEY (lot_id) REFERENCES chantier_lots (id),
    CONSTRAINT uq_chantier_phases_tenant_chantier_code UNIQUE (tenant_id, chantier_id, code)
);

CREATE INDEX IF NOT EXISTS idx_chantier_phases_tenant_chantier
    ON chantier_phases (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_chantier_phases_lot
    ON chantier_phases (lot_id);
