CREATE TABLE IF NOT EXISTS dpgf (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    numero          VARCHAR(50) NOT NULL,
    metre_id        UUID NOT NULL REFERENCES metrees(id) ON DELETE RESTRICT,
    projet_nom      VARCHAR(500),
    tva_taux        NUMERIC(8, 4) NOT NULL DEFAULT 20,
    total_ht        NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_tva       NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_ttc       NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dpgf_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_dpgf_tenant_metre
    ON dpgf(tenant_id, metre_id);

CREATE TABLE IF NOT EXISTS dpgf_noeuds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    dpgf_id         UUID NOT NULL REFERENCES dpgf(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES dpgf_noeuds(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL,
    code            VARCHAR(50) NOT NULL,
    libelle         VARCHAR(500) NOT NULL,
    article_id      UUID REFERENCES ouvrages(id) ON DELETE SET NULL,
    metre_ligne_id  UUID REFERENCES metre_lignes(id) ON DELETE SET NULL,
    quantite        NUMERIC(18, 4),
    unite           VARCHAR(30),
    prix_unitaire   NUMERIC(18, 4),
    total           NUMERIC(18, 4),
    ordre           INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dpgf_noeuds_dpgf
    ON dpgf_noeuds(dpgf_id);

CREATE INDEX IF NOT EXISTS idx_dpgf_noeuds_parent
    ON dpgf_noeuds(parent_id);
