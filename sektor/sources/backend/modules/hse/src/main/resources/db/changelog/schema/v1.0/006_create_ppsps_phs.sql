CREATE TABLE IF NOT EXISTS ppsps (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    chantier_id             VARCHAR(100) NOT NULL,
    chantier_code           VARCHAR(50) NOT NULL,
    chantier_nom            VARCHAR(500) NOT NULL,
    coordonnateur_sps_nom   VARCHAR(255) NOT NULL,
    coordonnateur_sps_tel   VARCHAR(50),
    date                    DATE NOT NULL,
    mesures_collectives     TEXT NOT NULL,
    effectifs_max_jour      INTEGER,
    hommes_jour_estimes     INTEGER,
    observations            TEXT,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    version                 INTEGER NOT NULL DEFAULT 1,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ppsps_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_ppsps_tenant_chantier
    ON ppsps (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_ppsps_tenant_status
    ON ppsps (tenant_id, status);

CREATE TABLE IF NOT EXISTS ppsps_sections (
    id              VARCHAR(100) PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    ppsps_id        VARCHAR(100) NOT NULL,
    code            VARCHAR(20) NOT NULL,
    titre           VARCHAR(500) NOT NULL,
    contenu         TEXT,
    ordre           INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_ppsps_sections_ppsps FOREIGN KEY (ppsps_id) REFERENCES ppsps (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ppsps_sections_tenant_ppsps
    ON ppsps_sections (tenant_id, ppsps_id);

CREATE TABLE IF NOT EXISTS phs (
    id              VARCHAR(100) PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    numero          VARCHAR(50) NOT NULL,
    titre           VARCHAR(500) NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    date_revision   DATE NOT NULL,
    auteur_nom      VARCHAR(255) NOT NULL,
    contenu         TEXT,
    status          VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_phs_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_phs_tenant_status
    ON phs (tenant_id, status);
