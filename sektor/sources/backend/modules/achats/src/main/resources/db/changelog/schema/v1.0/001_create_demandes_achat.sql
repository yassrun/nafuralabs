CREATE TABLE IF NOT EXISTS demandes_achat (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    numero              VARCHAR(50) NOT NULL,
    chantier_id         VARCHAR(100),
    chantier_code       VARCHAR(50),
    chantier_name       VARCHAR(255),
    date_besoin         DATE NOT NULL,
    demandeur_id        VARCHAR(100) NOT NULL,
    demandeur_name      VARCHAR(255),
    motif               TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    approbateur_id      VARCHAR(100),
    approbateur_name    VARCHAR(255),
    approbation_date    DATE,
    motif_rejet         TEXT,
    bc_id               VARCHAR(100),
    bc_numero           VARCHAR(50),
    total_estime_ht     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_demandes_achat_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_demandes_achat_tenant_status
    ON demandes_achat(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_demandes_achat_tenant_chantier
    ON demandes_achat(tenant_id, chantier_id);

CREATE TABLE IF NOT EXISTS demandes_achat_lignes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    demande_achat_id    UUID NOT NULL REFERENCES demandes_achat(id) ON DELETE CASCADE,
    article_id          VARCHAR(100) NOT NULL,
    article_code        VARCHAR(50),
    article_name        VARCHAR(255),
    quantite            NUMERIC(18, 4) NOT NULL,
    uom_code            VARCHAR(30),
    prix_estime_ht      NUMERIC(18, 4),
    total_estime_ht     NUMERIC(18, 4),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demandes_achat_lignes_demande
    ON demandes_achat_lignes(demande_achat_id);
