CREATE TABLE IF NOT EXISTS non_conformites (
    id                              VARCHAR(100) PRIMARY KEY,
    tenant_id                       UUID NOT NULL,
    numero                          VARCHAR(50) NOT NULL,
    date_nc                         DATE NOT NULL,
    chantier_id                     VARCHAR(100),
    chantier_code                   VARCHAR(50),
    zone_chantier                   VARCHAR(255),
    type_nc                         VARCHAR(30) NOT NULL,
    description                     TEXT NOT NULL,
    causes_racines                  TEXT,
    action_corrective               TEXT,
    action_preventive               TEXT,
    verification_efficacite         TEXT,
    date_verification_efficacite    DATE,
    responsable_id                  VARCHAR(100),
    responsable_nom                 VARCHAR(255),
    date_echeance                   DATE,
    source_inspection_id            VARCHAR(100),
    source_inspection_numero        VARCHAR(50),
    cnss_ou_inspection_reference    VARCHAR(100),
    registre_legal_numero           VARCHAR(100),
    status                          VARCHAR(30) NOT NULL DEFAULT 'OUVERTE',
    notes                           TEXT,
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_non_conformites_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_non_conformites_tenant_status
    ON non_conformites(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_non_conformites_tenant_chantier
    ON non_conformites(tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_non_conformites_tenant_type
    ON non_conformites(tenant_id, type_nc);

CREATE TABLE IF NOT EXISTS capa_actions (
    id                              VARCHAR(100) PRIMARY KEY,
    tenant_id                       UUID NOT NULL,
    non_conformite_id               VARCHAR(100) NOT NULL REFERENCES non_conformites(id) ON DELETE CASCADE,
    type_capa                       VARCHAR(30) NOT NULL,
    description                     TEXT NOT NULL,
    responsable_id                  VARCHAR(100),
    responsable_nom                 VARCHAR(255),
    date_echeance                   DATE,
    status                          VARCHAR(30) NOT NULL DEFAULT 'PLANIFIEE',
    created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_capa_actions_tenant_nc
    ON capa_actions(tenant_id, non_conformite_id);
