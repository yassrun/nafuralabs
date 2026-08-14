CREATE TABLE IF NOT EXISTS metrees (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    numero              VARCHAR(50) NOT NULL,
    projet_nom          VARCHAR(500) NOT NULL,
    ville               VARCHAR(255),
    date_metre          DATE NOT NULL,
    metreur_id          VARCHAR(100) NOT NULL,
    metreur_name        VARCHAR(255),
    notes               TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_metrees_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_metrees_tenant_status
    ON metrees(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_metrees_tenant_date
    ON metrees(tenant_id, date_metre DESC);

CREATE TABLE IF NOT EXISTS metre_lignes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    metre_id            UUID NOT NULL REFERENCES metrees(id) ON DELETE CASCADE,
    ouvrage_id          UUID REFERENCES ouvrages(id) ON DELETE SET NULL,
    ouvrage_code        VARCHAR(50),
    designation_libre     VARCHAR(500),
    unite               VARCHAR(30) NOT NULL,
    lot_code            VARCHAR(20),
    sous_lot_code       VARCHAR(20),
    lot_libelle         VARCHAR(255),
    sous_lot_libelle    VARCHAR(255),
    longueur            NUMERIC(18, 4),
    largeur             NUMERIC(18, 4),
    hauteur             NUMERIC(18, 4),
    nombre              NUMERIC(18, 4),
    formule             VARCHAR(255),
    quantite_calculee   NUMERIC(18, 4) NOT NULL DEFAULT 0,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metre_lignes_metre
    ON metre_lignes(metre_id);

CREATE INDEX IF NOT EXISTS idx_metre_lignes_tenant_ouvrage
    ON metre_lignes(tenant_id, ouvrage_id);
