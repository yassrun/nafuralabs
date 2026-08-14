CREATE TABLE IF NOT EXISTS appels_offres_achat (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    numero                      VARCHAR(50) NOT NULL,
    objet                       VARCHAR(500) NOT NULL,
    chantier_id                 VARCHAR(100),
    chantier_code               VARCHAR(50),
    chantier_name               VARCHAR(255),
    date_publication            DATE,
    date_limite_depot           DATE NOT NULL,
    status                      VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    fournisseur_attribue_id     VARCHAR(100),
    fournisseur_attribue_name   VARCHAR(255),
    bc_genere_id                VARCHAR(100),
    bc_genere_numero            VARCHAR(50),
    total_attribue_ht           NUMERIC(18, 4),
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_appels_offres_achat_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_appels_offres_achat_tenant_status
    ON appels_offres_achat(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_appels_offres_achat_tenant_chantier
    ON appels_offres_achat(tenant_id, chantier_id);

CREATE TABLE IF NOT EXISTS appels_offres_achat_invites (
    appel_offre_achat_id        UUID NOT NULL REFERENCES appels_offres_achat(id) ON DELETE CASCADE,
    fournisseur_id              VARCHAR(100) NOT NULL,
    PRIMARY KEY (appel_offre_achat_id, fournisseur_id)
);

CREATE TABLE IF NOT EXISTS appels_offres_lignes (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    appel_offre_achat_id        UUID NOT NULL REFERENCES appels_offres_achat(id) ON DELETE CASCADE,
    article_id                  VARCHAR(100) NOT NULL,
    article_code                VARCHAR(50),
    article_name                VARCHAR(255),
    quantite                    NUMERIC(18, 4) NOT NULL,
    uom_code                    VARCHAR(30),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appels_offres_lignes_ao
    ON appels_offres_lignes(appel_offre_achat_id);

CREATE TABLE IF NOT EXISTS offres_fournisseur (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    appel_offre_achat_id        UUID NOT NULL REFERENCES appels_offres_achat(id) ON DELETE CASCADE,
    fournisseur_id              VARCHAR(100) NOT NULL,
    fournisseur_name            VARCHAR(255),
    date_reponse                DATE,
    total_ht                    NUMERIC(18, 4) NOT NULL DEFAULT 0,
    delai_livraison_jours       INTEGER,
    conditions_paiement         VARCHAR(255),
    notes                       TEXT,
    retenue                     BOOLEAN NOT NULL DEFAULT false,
    score                       NUMERIC(8, 2),
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offres_fournisseur_ao
    ON offres_fournisseur(appel_offre_achat_id);

CREATE TABLE IF NOT EXISTS offres_fournisseur_lignes (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    offre_fournisseur_id        UUID NOT NULL REFERENCES offres_fournisseur(id) ON DELETE CASCADE,
    appel_offre_ligne_id        UUID NOT NULL REFERENCES appels_offres_lignes(id) ON DELETE CASCADE,
    prix_unitaire_ht            NUMERIC(18, 4) NOT NULL,
    total_ht                    NUMERIC(18, 4) NOT NULL,
    delai_specifique            INTEGER,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offres_fournisseur_lignes_offre
    ON offres_fournisseur_lignes(offre_fournisseur_id);
