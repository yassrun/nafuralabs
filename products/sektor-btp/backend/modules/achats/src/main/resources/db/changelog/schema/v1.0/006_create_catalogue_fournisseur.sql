CREATE TABLE IF NOT EXISTS catalogue_fournisseur_lignes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    fournisseur_id      VARCHAR(100) NOT NULL,
    article_id          VARCHAR(100) NOT NULL,
    ref_fournisseur     VARCHAR(100),
    designation         VARCHAR(255) NOT NULL,
    prix_unitaire_ht    NUMERIC(18, 4) NOT NULL,
    uom                 VARCHAR(30),
    actif               BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_catalogue_fournisseur_lignes_tenant_fournisseur_article
        UNIQUE (tenant_id, fournisseur_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_catalogue_fournisseur_lignes_tenant_fournisseur
    ON catalogue_fournisseur_lignes(tenant_id, fournisseur_id);

CREATE INDEX IF NOT EXISTS idx_catalogue_fournisseur_lignes_tenant_article
    ON catalogue_fournisseur_lignes(tenant_id, article_id);

CREATE INDEX IF NOT EXISTS idx_catalogue_fournisseur_lignes_tenant_actif
    ON catalogue_fournisseur_lignes(tenant_id, actif);
