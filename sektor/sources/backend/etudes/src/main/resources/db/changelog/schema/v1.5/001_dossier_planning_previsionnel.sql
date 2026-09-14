-- Planning prévisionnel + ressources prévues (étude, optionnel).
CREATE TABLE IF NOT EXISTS dossier_planning_activites (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    dossier_id      UUID NOT NULL,
    dpgf_noeud_id   UUID,
    lot_libelle     VARCHAR(500),
    libelle         VARCHAR(500) NOT NULL,
    date_debut      DATE NOT NULL,
    date_fin        DATE NOT NULL,
    ordre           INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL,
    CONSTRAINT dossier_planning_activites_dates_chk CHECK (date_fin >= date_debut)
);

CREATE INDEX IF NOT EXISTS dossier_planning_activites_dossier_idx
    ON dossier_planning_activites (tenant_id, dossier_id, ordre);

CREATE TABLE IF NOT EXISTS dossier_planning_ressources (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    dossier_id      UUID NOT NULL,
    type            VARCHAR(20) NOT NULL,
    libelle         VARCHAR(255) NOT NULL,
    quantite        NUMERIC(18, 4) NOT NULL DEFAULT 1,
    unite           VARCHAR(30),
    employe_id      VARCHAR(100),
    materiel_id     VARCHAR(100),
    notes           VARCHAR(1000),
    ordre           INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL,
    updated_at      TIMESTAMPTZ NOT NULL,
    CONSTRAINT dossier_planning_ressources_type_chk CHECK (type IN ('HUMAIN', 'MATERIEL'))
);

CREATE INDEX IF NOT EXISTS dossier_planning_ressources_dossier_idx
    ON dossier_planning_ressources (tenant_id, dossier_id, type, ordre);
