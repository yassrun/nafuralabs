CREATE TABLE IF NOT EXISTS frais_deplacement (
    id              VARCHAR(100) PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    employe_id      VARCHAR(100) NOT NULL,
    employe_nom     VARCHAR(255),
    type            VARCHAR(30) NOT NULL,
    date            DATE NOT NULL,
    montant         NUMERIC(18, 4) NOT NULL,
    km              NUMERIC(10, 2),
    status          VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    motif_rejet     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_frais_deplacement_tenant_status
    ON frais_deplacement(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_frais_deplacement_tenant_employe
    ON frais_deplacement(tenant_id, employe_id);
CREATE INDEX IF NOT EXISTS idx_frais_deplacement_tenant_date
    ON frais_deplacement(tenant_id, date);
