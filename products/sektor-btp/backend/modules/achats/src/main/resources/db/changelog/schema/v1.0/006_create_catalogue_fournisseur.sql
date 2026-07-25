CREATE TABLE IF NOT EXISTS catalogue_fournisseur_lignes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    fournisseur_id      VARCHAR(100) NOT NULL,
    article_id          VARCHAR(100) NOT NULL,
    ref_fournisseur     VARCHAR(100),
    designation         VARCHAR(255) NOT NULL,
    prix_unitaire_ht    NUMERIC(18, 4) NOT NULL,
    currency_id         UUID,
    remise_percent      NUMERIC(8, 4) NOT NULL DEFAULT 0,
    quantite_min        NUMERIC(18, 4),
    delai_jours         INT,
    incoterm            VARCHAR(20),
    uom                 VARCHAR(30),
    valid_from          DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_to            DATE,
    source              VARCHAR(20) NOT NULL DEFAULT 'SAISIE_MANUELLE',
    source_ref_id       UUID,
    actif               BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_catalogue_fournisseur_lignes_tenant_fournisseur
    ON catalogue_fournisseur_lignes(tenant_id, fournisseur_id);

CREATE INDEX IF NOT EXISTS idx_catalogue_fournisseur_lignes_tenant_article
    ON catalogue_fournisseur_lignes(tenant_id, article_id);

CREATE INDEX IF NOT EXISTS idx_catalogue_fournisseur_lignes_tenant_actif
    ON catalogue_fournisseur_lignes(tenant_id, actif);

-- Historisation: une seule ligne « ouverte » (valid_to IS NULL) par couple fournisseur/article actif
CREATE UNIQUE INDEX IF NOT EXISTS uq_cat_fourn_open_ligne
    ON catalogue_fournisseur_lignes (tenant_id, fournisseur_id, article_id)
    WHERE actif = true AND valid_to IS NULL;

CREATE INDEX IF NOT EXISTS cat_fourn_lookup_idx
    ON catalogue_fournisseur_lignes (tenant_id, article_id, valid_from DESC)
    WHERE actif = true;
