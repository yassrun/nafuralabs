CREATE TABLE IF NOT EXISTS visites_medicales (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    employe_id              VARCHAR(100) NOT NULL,
    employe_matricule       VARCHAR(50) NOT NULL,
    employe_nom             VARCHAR(255) NOT NULL,
    poste_occupe            VARCHAR(255) NOT NULL,
    type                    VARCHAR(30) NOT NULL,
    date                    DATE NOT NULL,
    aptitude                VARCHAR(30) NOT NULL,
    medecin_nom             VARCHAR(255) NOT NULL,
    restrictions            TEXT,
    prochaine_echeance      DATE NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visites_medicales_tenant_employe
    ON visites_medicales (tenant_id, employe_id);

CREATE INDEX IF NOT EXISTS idx_visites_medicales_tenant_date
    ON visites_medicales (tenant_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_visites_medicales_tenant_prochaine_echeance
    ON visites_medicales (tenant_id, prochaine_echeance);
