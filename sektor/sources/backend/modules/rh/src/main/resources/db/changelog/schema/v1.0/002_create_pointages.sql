CREATE TABLE IF NOT EXISTS pointage_batches (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    client_id           UUID,
    chef_employe_id     VARCHAR(100) NOT NULL,
    chantier_id         VARCHAR(100) NOT NULL,
    date_pointage       DATE NOT NULL,
    gps_lat             NUMERIC(10, 7),
    gps_lng             NUMERIC(10, 7),
    signature_url       VARCHAR(500),
    photo_url           VARCHAR(500),
    status              VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_pointage_batches_tenant_client UNIQUE (tenant_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_pointage_batches_tenant_chantier_date
    ON pointage_batches(tenant_id, chantier_id, date_pointage);

CREATE TABLE IF NOT EXISTS pointages (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    batch_id                VARCHAR(100) NOT NULL REFERENCES pointage_batches(id) ON DELETE CASCADE,
    employe_id              VARCHAR(100) NOT NULL,
    chantier_id             VARCHAR(100) NOT NULL,
    date                    DATE NOT NULL,
    mode                    VARCHAR(30) NOT NULL,
    heure_arrivee           VARCHAR(5),
    heure_depart            VARCHAR(5),
    heures_normales         NUMERIC(8, 2) NOT NULL DEFAULT 0,
    heures_sup              NUMERIC(8, 2) NOT NULL DEFAULT 0,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    poste_budgetaire_id     VARCHAR(100),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pointages_tenant_chantier_date
    ON pointages(tenant_id, chantier_id, date);
CREATE INDEX IF NOT EXISTS idx_pointages_tenant_employe_date
    ON pointages(tenant_id, employe_id, date);
CREATE INDEX IF NOT EXISTS idx_pointages_tenant_batch
    ON pointages(tenant_id, batch_id);
