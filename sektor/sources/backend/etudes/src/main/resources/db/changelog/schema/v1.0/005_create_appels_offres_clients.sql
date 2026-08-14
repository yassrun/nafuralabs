CREATE TABLE IF NOT EXISTS appels_offres_clients (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    numero                      VARCHAR(50) NOT NULL,
    reference                   VARCHAR(100) NOT NULL,
    objet                       VARCHAR(500) NOT NULL,
    donneur_ordre               VARCHAR(255) NOT NULL,
    type                        VARCHAR(20) NOT NULL,
    date_limite_depot           DATE NOT NULL,
    date_ouverture_plis         DATE,
    caution_provisoire          NUMERIC(18, 4),
    caution_definitive          NUMERIC(18, 4),
    caution_retenue_garantie    NUMERIC(18, 4),
    estimation_moa_ht           NUMERIC(18, 4),
    ville                       VARCHAR(255),
    delai_execution_jours       INTEGER,
    status                      VARCHAR(30) NOT NULL DEFAULT 'A_ETUDIER',
    devis_id                    VARCHAR(100),
    devis_numero                VARCHAR(50),
    metre_id                    VARCHAR(100),
    metre_numero                VARCHAR(50),
    resultat_rang_notre         INTEGER,
    resultat_nb_plis            INTEGER,
    resultat_attributaire       VARCHAR(255),
    resultat_montant_ht         NUMERIC(18, 4),
    chantier_genere_id          VARCHAR(100),
    documents                   JSONB NOT NULL DEFAULT '[]'::jsonb,
    checklist                   JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_appels_offres_clients_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_appels_offres_clients_tenant_status
    ON appels_offres_clients(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_appels_offres_clients_tenant_date_limite
    ON appels_offres_clients(tenant_id, date_limite_depot DESC);
