CREATE TABLE IF NOT EXISTS prix_dpu (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    -- Un sous-détail se rattache soit à un ouvrage de bibliothèque, soit à un nœud de bordereau.
    ouvrage_id                  UUID REFERENCES ouvrages(id) ON DELETE CASCADE,
    dpgf_noeud_id               UUID,
    source_ouvrage_id           UUID,
    debours_sec                 NUMERIC(18, 4) NOT NULL DEFAULT 0,
    frais_generaux_percent      NUMERIC(8, 4) NOT NULL DEFAULT 8,
    marge_beneficiaire_percent  NUMERIC(8, 4) NOT NULL DEFAULT 7,
    prix_vente_ht               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    prix_vente_ttc              NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tva_taux                    NUMERIC(8, 4) NOT NULL DEFAULT 20,
    -- Production journalière de l'ouvrage : divise les composants chiffrés à la journée.
    rendement_journalier        NUMERIC(18, 4),
    created_by                  VARCHAR(100),
    updated_by                  VARCHAR(100),
    version                     BIGINT NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT prix_dpu_rattachement_chk
        CHECK (ouvrage_id IS NOT NULL OR dpgf_noeud_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_prix_dpu_tenant_ouvrage
    ON prix_dpu(tenant_id, ouvrage_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_prix_dpu_tenant_ouvrage
    ON prix_dpu (tenant_id, ouvrage_id)
    WHERE ouvrage_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_prix_dpu_tenant_noeud
    ON prix_dpu (tenant_id, dpgf_noeud_id)
    WHERE dpgf_noeud_id IS NOT NULL;

-- FKs croisées prix_dpu <-> dpgf_noeuds : posées ici, une fois les deux tables créées.
ALTER TABLE prix_dpu
    ADD CONSTRAINT fk_prix_dpu_dpgf_noeud
        FOREIGN KEY (dpgf_noeud_id) REFERENCES dpgf_noeuds(id) ON DELETE CASCADE;

ALTER TABLE dpgf_noeuds
    ADD CONSTRAINT fk_dpgf_noeuds_prix_dpu
        FOREIGN KEY (prix_dpu_id) REFERENCES prix_dpu(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS composants_dpu (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    prix_dpu_id         UUID NOT NULL REFERENCES prix_dpu(id) ON DELETE CASCADE,
    type                VARCHAR(30) NOT NULL,
    article_ou_poste_id VARCHAR(100) NOT NULL,
    -- Rendement par unité d'ouvrage (PAR_UNITE) ou à la journée (PAR_JOUR), cf. base_rendement.
    rendement           NUMERIC(18, 4) NOT NULL DEFAULT 0,
    base_rendement      VARCHAR(20),
    unite               VARCHAR(30) NOT NULL,
    prix_unitaire       NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    source_prix         VARCHAR(20) NOT NULL DEFAULT 'MANUEL',
    offre_fournisseur_id UUID,
    suggere_par_ia      BOOLEAN NOT NULL DEFAULT FALSE,
    ordre               INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT composants_dpu_base_chk
        CHECK (base_rendement IS NULL OR base_rendement IN ('PAR_UNITE', 'PAR_JOUR'))
);

CREATE INDEX IF NOT EXISTS idx_composants_dpu_prix_dpu
    ON composants_dpu(prix_dpu_id);

CREATE TABLE IF NOT EXISTS dpu_versions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    prix_dpu_id             UUID NOT NULL REFERENCES prix_dpu(id) ON DELETE CASCADE,
    saved_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    frais_generaux_percent  NUMERIC(8, 4) NOT NULL,
    marge_percent           NUMERIC(8, 4) NOT NULL,
    prix_vente_ht           NUMERIC(18, 4) NOT NULL,
    snapshot_json           JSONB NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dpu_versions_prix_dpu
    ON dpu_versions(prix_dpu_id, saved_at DESC);
