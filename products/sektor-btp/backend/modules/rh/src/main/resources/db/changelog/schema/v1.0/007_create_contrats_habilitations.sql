CREATE TABLE IF NOT EXISTS contrats (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    employe_id          VARCHAR(100) NOT NULL,
    type_contrat        VARCHAR(30) NOT NULL,
    date_debut          DATE NOT NULL,
    date_fin            DATE,
    salaire_base        NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status              VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    signature_data_url  TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contrats_tenant_employe ON contrats(tenant_id, employe_id);
CREATE INDEX IF NOT EXISTS idx_contrats_tenant_status ON contrats(tenant_id, status);

CREATE TABLE IF NOT EXISTS habilitations (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    employe_id          VARCHAR(100) NOT NULL,
    code                VARCHAR(50) NOT NULL,
    libelle             VARCHAR(255) NOT NULL,
    date_obtention      DATE NOT NULL,
    date_expiration     DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habilitations_tenant_employe ON habilitations(tenant_id, employe_id);
CREATE INDEX IF NOT EXISTS idx_habilitations_tenant_expiration ON habilitations(tenant_id, date_expiration);

CREATE TABLE IF NOT EXISTS formations (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    employe_id          VARCHAR(100) NOT NULL,
    libelle             VARCHAR(255) NOT NULL,
    date                DATE NOT NULL,
    organisme           VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_formations_tenant_employe ON formations(tenant_id, employe_id);
CREATE INDEX IF NOT EXISTS idx_formations_tenant_date ON formations(tenant_id, date);
