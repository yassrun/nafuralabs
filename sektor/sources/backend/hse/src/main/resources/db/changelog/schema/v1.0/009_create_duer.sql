CREATE TABLE IF NOT EXISTS duer (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    chantier_id             VARCHAR(100),
    chantier_code           VARCHAR(50),
    chantier_nom            VARCHAR(255),
    version                 VARCHAR(20) NOT NULL,
    date_revision           DATE NOT NULL,
    auteur_id               VARCHAR(100),
    auteur_nom              VARCHAR(255),
    risques_identifies      INTEGER NOT NULL DEFAULT 0,
    actions_correctives     INTEGER NOT NULL DEFAULT 0,
    observations            TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_duer_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_duer_tenant_status
    ON duer (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_duer_tenant_chantier
    ON duer (tenant_id, chantier_id);

CREATE TABLE IF NOT EXISTS duer_risques (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    duer_id                 VARCHAR(100) NOT NULL REFERENCES duer (id) ON DELETE CASCADE,
    libelle                 VARCHAR(500) NOT NULL,
    probabilite             INTEGER NOT NULL,
    gravite                 INTEGER NOT NULL,
    code_activite           VARCHAR(50),
    mesures                 TEXT,
    ordre                   INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_duer_risques_tenant_duer
    ON duer_risques (tenant_id, duer_id);
