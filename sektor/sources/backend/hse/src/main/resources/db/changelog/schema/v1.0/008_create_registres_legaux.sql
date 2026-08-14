CREATE TABLE IF NOT EXISTS registres_legaux (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    registre                VARCHAR(30) NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    date                    DATE NOT NULL,
    reference               VARCHAR(100),
    chantier_id             VARCHAR(100),
    chantier_code           VARCHAR(50),
    employe_id              VARCHAR(100),
    employe_nom             VARCHAR(255),
    description             TEXT NOT NULL,
    statut                  VARCHAR(20) NOT NULL DEFAULT 'OUVERT',
    derniere_maj            DATE,
    extension_json          TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_registres_legaux_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_registres_legaux_tenant_registre
    ON registres_legaux (tenant_id, registre);

CREATE INDEX IF NOT EXISTS idx_registres_legaux_tenant_chantier
    ON registres_legaux (tenant_id, chantier_id);
