CREATE TABLE IF NOT EXISTS inspections (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    date_inspection         DATE NOT NULL,
    chantier_id             VARCHAR(100),
    chantier_code           VARCHAR(50),
    inspecteur_nom          VARCHAR(255) NOT NULL,
    organisme_type          VARCHAR(30),
    reference_rapport       VARCHAR(255),
    thematique              VARCHAR(500) NOT NULL,
    nb_observations         INTEGER NOT NULL DEFAULT 0,
    nb_non_conformites      INTEGER NOT NULL DEFAULT 0,
    note_globale            NUMERIC(5, 2),
    status                  VARCHAR(30) NOT NULL DEFAULT 'PLANIFIEE',
    observations            TEXT,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_inspections_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_inspections_tenant_status
    ON inspections(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_inspections_tenant_chantier
    ON inspections(tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_inspections_tenant_date
    ON inspections(tenant_id, date_inspection DESC);

CREATE TABLE IF NOT EXISTS audits_hse (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    chantier_id             VARCHAR(100),
    chantier_code           VARCHAR(50),
    template_code           VARCHAR(50),
    titre                   VARCHAR(500) NOT NULL,
    auditeur_nom            VARCHAR(255) NOT NULL,
    date_audit              DATE NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    score_global            NUMERIC(5, 2),
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_audits_hse_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_audits_hse_tenant_status
    ON audits_hse(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_audits_hse_tenant_chantier
    ON audits_hse(tenant_id, chantier_id);

CREATE TABLE IF NOT EXISTS audit_hse_lignes (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    audit_id                VARCHAR(100) NOT NULL REFERENCES audits_hse(id) ON DELETE CASCADE,
    ordre                   INTEGER NOT NULL DEFAULT 0,
    code                    VARCHAR(50) NOT NULL,
    libelle                 VARCHAR(500) NOT NULL,
    categorie               VARCHAR(100),
    reponse                 VARCHAR(20),
    commentaire             TEXT,
    nc_id                   VARCHAR(100),
    nc_numero               VARCHAR(50),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_hse_lignes_tenant_audit
    ON audit_hse_lignes(tenant_id, audit_id);
