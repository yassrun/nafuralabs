CREATE TABLE IF NOT EXISTS dpgf (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    numero          VARCHAR(50) NOT NULL,
    -- Nullable : un DPGF peut naître d'un dossier d'étude (import bordereau) sans métré amont.
    metre_id        UUID REFERENCES metrees(id) ON DELETE RESTRICT,
    projet_nom      VARCHAR(500),
    tva_taux        NUMERIC(8, 4) NOT NULL DEFAULT 20,
    total_ht        NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_tva       NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_ttc       NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    version         BIGINT NOT NULL DEFAULT 0,
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
    descriptif      TEXT,
    -- FOURNI : prix unitaire saisi tel quel. DECOMPOSE : prix issu d'un sous-détail (prix_dpu).
    mode            VARCHAR(20),
    article_id      UUID REFERENCES ouvrages(id) ON DELETE SET NULL,
    metre_ligne_id  UUID REFERENCES metre_lignes(id) ON DELETE SET NULL,
    -- FK vers prix_dpu posée dans 004 (dépendance croisée entre les deux tables).
    prix_dpu_id     UUID,
    quantite        NUMERIC(18, 4),
    unite           VARCHAR(30),
    prix_unitaire   NUMERIC(18, 4),
    prix_fourni_base NUMERIC(18, 4),
    frais_generaux_percent NUMERIC(8, 4),
    marge_percent   NUMERIC(8, 4),
    total           NUMERIC(18, 4),
    -- Traçabilité du descriptif : le chiffreur doit pouvoir remonter à la source dans le CPS.
    descriptif_source            VARCHAR(20),
    descriptif_source_section_id UUID,
    descriptif_suggere_par_ia    BOOLEAN NOT NULL DEFAULT FALSE,
    ordre           INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT dpgf_noeuds_mode_chk CHECK (
        (type = 'ARTICLE' AND (mode IS NULL OR mode IN ('FOURNI', 'DECOMPOSE')))
        OR (type <> 'ARTICLE' AND mode IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_dpgf_noeuds_dpgf
    ON dpgf_noeuds(dpgf_id);

CREATE INDEX IF NOT EXISTS idx_dpgf_noeuds_parent
    ON dpgf_noeuds(parent_id);

COMMENT ON COLUMN dpgf_noeuds.prix_fourni_base IS
    'Coût unitaire saisi en mode FOURNI, avant frais généraux et marge';
