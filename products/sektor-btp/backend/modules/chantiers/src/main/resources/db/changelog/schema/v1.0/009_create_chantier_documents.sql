CREATE TABLE IF NOT EXISTS documents_chantier (
    id              VARCHAR(100) PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    chantier_id     VARCHAR(100) NOT NULL,
    type            VARCHAR(30) NOT NULL,
    titre           VARCHAR(500) NOT NULL,
    fichier         VARCHAR(500) NOT NULL,
    taille          BIGINT NOT NULL DEFAULT 0,
    uploaded_at     DATE NOT NULL,
    uploaded_par    VARCHAR(200) NOT NULL,
    tags            JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_documents_chantier_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id)
);

CREATE INDEX IF NOT EXISTS idx_documents_chantier_tenant_chantier
    ON documents_chantier (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_documents_chantier_tenant_type
    ON documents_chantier (tenant_id, type);

CREATE TABLE IF NOT EXISTS journal_chantier (
    id              VARCHAR(100) PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    chantier_id     VARCHAR(100) NOT NULL,
    date            DATE NOT NULL,
    auteur          VARCHAR(200) NOT NULL,
    contenu         VARCHAR(4000) NOT NULL,
    type            VARCHAR(50) NOT NULL DEFAULT 'NOTE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_journal_chantier_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id)
);

CREATE INDEX IF NOT EXISTS idx_journal_chantier_tenant_chantier
    ON journal_chantier (tenant_id, chantier_id);

CREATE TABLE IF NOT EXISTS attachements_chantier (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    chantier_id             VARCHAR(100) NOT NULL,
    numero                  VARCHAR(120) NOT NULL,
    date                    DATE NOT NULL,
    meteo_code              VARCHAR(20),
    temperature_c           INTEGER,
    effectif_present        INTEGER NOT NULL DEFAULT 0,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    signature_moe_data_url  TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_attachements_chantier_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id)
);

CREATE INDEX IF NOT EXISTS idx_attachements_chantier_tenant_chantier
    ON attachements_chantier (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_attachements_chantier_tenant_status
    ON attachements_chantier (tenant_id, status);

CREATE TABLE IF NOT EXISTS attachement_lignes (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    attachement_id      VARCHAR(100) NOT NULL,
    poste_code          VARCHAR(50) NOT NULL,
    designation         VARCHAR(500) NOT NULL,
    quantite_executee   NUMERIC(18, 4) NOT NULL DEFAULT 0,
    unite               VARCHAR(30) NOT NULL,
    zone                VARCHAR(200),
    ordre               INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_attachement_lignes_attachement FOREIGN KEY (attachement_id) REFERENCES attachements_chantier (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attachement_lignes_tenant_attachement
    ON attachement_lignes (tenant_id, attachement_id);
