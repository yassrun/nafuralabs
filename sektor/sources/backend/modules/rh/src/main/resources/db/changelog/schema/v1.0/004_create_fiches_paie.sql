CREATE TABLE IF NOT EXISTS fiches_paie (
    id                          VARCHAR(100) PRIMARY KEY,
    tenant_id                   UUID NOT NULL,
    numero                      VARCHAR(50) NOT NULL,
    employe_id                  VARCHAR(100) NOT NULL,
    employe_nom                 VARCHAR(255),
    mois                        VARCHAR(7) NOT NULL,
    salaire_base                NUMERIC(18, 4) NOT NULL,
    indemnite_representation    NUMERIC(18, 4) NOT NULL DEFAULT 0,
    indemnite_transport         NUMERIC(18, 4) NOT NULL DEFAULT 0,
    montant_heures_sup          NUMERIC(18, 4) NOT NULL DEFAULT 0,
    salaire_brut                NUMERIC(18, 4) NOT NULL,
    cotisation_cnss             NUMERIC(18, 4) NOT NULL,
    cotisation_amo              NUMERIC(18, 4) NOT NULL,
    total_retenues              NUMERIC(18, 4) NOT NULL,
    salaire_net_imposable       NUMERIC(18, 4) NOT NULL,
    igr                         NUMERIC(18, 4) NOT NULL,
    salaire_net_a_payer         NUMERIC(18, 4) NOT NULL,
    status                      VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_fiches_paie_tenant_numero UNIQUE (tenant_id, numero),
    CONSTRAINT uq_fiches_paie_tenant_employe_mois UNIQUE (tenant_id, employe_id, mois)
);

CREATE INDEX IF NOT EXISTS idx_fiches_paie_tenant_mois ON fiches_paie(tenant_id, mois);
CREATE INDEX IF NOT EXISTS idx_fiches_paie_tenant_employe ON fiches_paie(tenant_id, employe_id);
CREATE INDEX IF NOT EXISTS idx_fiches_paie_tenant_status ON fiches_paie(tenant_id, status);
