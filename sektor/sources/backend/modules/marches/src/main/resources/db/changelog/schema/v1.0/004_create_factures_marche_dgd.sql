CREATE TABLE IF NOT EXISTS factures_marche (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    contrat_marche_id       VARCHAR(100) NOT NULL,
    marche_numero           VARCHAR(50),
    chantier_id             VARCHAR(100),
    chantier_code           VARCHAR(50),
    client_nom              VARCHAR(255),
    montant_brut_ht         NUMERIC(18, 4) NOT NULL DEFAULT 0,
    avance_deduite_ht       NUMERIC(18, 4) NOT NULL DEFAULT 0,
    retenue_garantie_ht     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    net_ht                  NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tva_taux                NUMERIC(8, 4) NOT NULL DEFAULT 20,
    tva_montant             NUMERIC(18, 4) NOT NULL DEFAULT 0,
    net_ttc                 NUMERIC(18, 4) NOT NULL DEFAULT 0,
    retenue_source_taux     NUMERIC(8, 4) NOT NULL DEFAULT 0,
    retenue_source_montant  NUMERIC(18, 4) NOT NULL DEFAULT 0,
    timbre_fiscal           NUMERIC(18, 4) NOT NULL DEFAULT 0,
    net_a_payer             NUMERIC(18, 4) NOT NULL DEFAULT 0,
    date_emission           DATE,
    date_echeance           DATE,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    facture_client_id       VARCHAR(100),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_factures_marche_tenant_numero UNIQUE (tenant_id, numero),
    CONSTRAINT fk_factures_marche_contrat FOREIGN KEY (contrat_marche_id)
        REFERENCES contrats_marche (id) ON DELETE CASCADE,
    CONSTRAINT chk_factures_marche_status CHECK (
        status IN (
            'BROUILLON', 'EMISE', 'ENVOYEE_MOA', 'ACCEPTEE', 'PAYEE', 'ANNULEE'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_factures_marche_tenant_contrat
    ON factures_marche (tenant_id, contrat_marche_id);

CREATE INDEX IF NOT EXISTS idx_factures_marche_tenant_status
    ON factures_marche (tenant_id, status);

CREATE TABLE IF NOT EXISTS dgd_marche (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    contrat_marche_id       VARCHAR(100) NOT NULL,
    marche_numero           VARCHAR(50),
    cumul_situations_ttc    NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cumul_retenue_garantie  NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cumul_revision_k        NUMERIC(18, 4) NOT NULL DEFAULT 0,
    cumul_penalites         NUMERIC(18, 4) NOT NULL DEFAULT 0,
    reprises_rg             NUMERIC(18, 4) NOT NULL DEFAULT 0,
    montant_net_a_payer     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_dgd_marche_tenant_numero UNIQUE (tenant_id, numero),
    CONSTRAINT fk_dgd_marche_contrat FOREIGN KEY (contrat_marche_id)
        REFERENCES contrats_marche (id) ON DELETE CASCADE,
    CONSTRAINT chk_dgd_marche_status CHECK (
        status IN ('BROUILLON', 'SOUMIS_MOA', 'NOTIFIE', 'PAYE')
    )
);

CREATE INDEX IF NOT EXISTS idx_dgd_marche_tenant_contrat
    ON dgd_marche (tenant_id, contrat_marche_id);

CREATE INDEX IF NOT EXISTS idx_dgd_marche_tenant_status
    ON dgd_marche (tenant_id, status);
