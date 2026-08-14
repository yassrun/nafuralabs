CREATE TABLE IF NOT EXISTS heures_supplementaires (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    employe_id          VARCHAR(100) NOT NULL,
    date                DATE NOT NULL,
    type                VARCHAR(10) NOT NULL,
    heures              NUMERIC(8, 2) NOT NULL,
    taux_majoration     NUMERIC(6, 4) NOT NULL,
    montant             NUMERIC(18, 4) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    pointage_id         VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_heures_sup_type CHECK (type IN ('HS25', 'HS50', 'HS100'))
);

CREATE INDEX IF NOT EXISTS idx_heures_sup_tenant_employe ON heures_supplementaires(tenant_id, employe_id);
CREATE INDEX IF NOT EXISTS idx_heures_sup_tenant_date ON heures_supplementaires(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_heures_sup_tenant_status ON heures_supplementaires(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_heures_sup_pointage ON heures_supplementaires(tenant_id, pointage_id);
