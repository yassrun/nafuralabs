CREATE TABLE IF NOT EXISTS epi_dotations (
    id                          VARCHAR(100) PRIMARY KEY,
    tenant_id                   UUID NOT NULL,
    reference                   VARCHAR(50) NOT NULL,
    designation                 VARCHAR(500) NOT NULL,
    categorie                   VARCHAR(30) NOT NULL,
    marque                      VARCHAR(100) NOT NULL,
    norme_ce                    VARCHAR(50),
    employe_id                  VARCHAR(100) NOT NULL,
    employe_nom                 VARCHAR(255) NOT NULL,
    chantier_id                 VARCHAR(100),
    chantier_code               VARCHAR(50),
    date_attribution            DATE NOT NULL,
    date_expiration             DATE,
    prix_unitaire               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status                      VARCHAR(30) NOT NULL DEFAULT 'OK',
    article_id                  VARCHAR(100),
    date_derniere_verification  DATE,
    prochaine_verification      DATE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_epi_dotations_tenant_reference_employe UNIQUE (tenant_id, reference, employe_id)
);

CREATE INDEX IF NOT EXISTS idx_epi_dotations_tenant_employe
    ON epi_dotations (tenant_id, employe_id);

CREATE INDEX IF NOT EXISTS idx_epi_dotations_tenant_status
    ON epi_dotations (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_epi_dotations_tenant_date_expiration
    ON epi_dotations (tenant_id, date_expiration);
