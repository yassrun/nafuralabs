CREATE TABLE IF NOT EXISTS conges (
    id              VARCHAR(100) PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    numero          VARCHAR(50) NOT NULL,
    employe_id      VARCHAR(100) NOT NULL,
    employe_nom     VARCHAR(255),
    type            VARCHAR(30) NOT NULL,
    date_debut      DATE NOT NULL,
    date_fin        DATE NOT NULL,
    nombre_jours    NUMERIC(8, 2) NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    motif           TEXT,
    motif_refus     TEXT,
    notes             TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_conges_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_conges_tenant_status ON conges(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_conges_tenant_employe ON conges(tenant_id, employe_id);
CREATE INDEX IF NOT EXISTS idx_conges_tenant_dates ON conges(tenant_id, date_debut, date_fin);

CREATE TABLE IF NOT EXISTS conge_soldes (
    id              VARCHAR(100) PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    employe_id      VARCHAR(100) NOT NULL,
    solde_jours     NUMERIC(8, 2) NOT NULL DEFAULT 0,
    credite_annuel  NUMERIC(8, 2) NOT NULL DEFAULT 0,
    pris_annuel     NUMERIC(8, 2) NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_conge_soldes_tenant_employe UNIQUE (tenant_id, employe_id)
);

CREATE INDEX IF NOT EXISTS idx_conge_soldes_tenant ON conge_soldes(tenant_id);
