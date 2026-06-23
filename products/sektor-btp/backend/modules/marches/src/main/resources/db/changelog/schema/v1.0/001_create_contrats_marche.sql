CREATE TABLE IF NOT EXISTS contrats_marche (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    reference               VARCHAR(100),
    intitule                VARCHAR(500) NOT NULL,
    chantier_id             VARCHAR(100) NOT NULL,
    chantier_code           VARCHAR(50),
    chantier_nom            VARCHAR(255),
    client_id               VARCHAR(100) NOT NULL,
    client_nom              VARCHAR(255),
    type_marche             VARCHAR(30) NOT NULL DEFAULT 'FORFAITAIRE',
    type_ccag_t             VARCHAR(30) NOT NULL DEFAULT 'TRAVAUX',
    nature_marche           VARCHAR(30),
    date_notification       DATE,
    date_demarrage          DATE,
    duree_mois              INTEGER,
    montant_ht              NUMERIC(18, 4) NOT NULL DEFAULT 0,
    taux_tva                NUMERIC(8, 4) NOT NULL DEFAULT 20,
    taux_rg                 NUMERIC(8, 4) NOT NULL DEFAULT 7,
    taux_ras                NUMERIC(8, 4) NOT NULL DEFAULT 0,
    taux_avance             NUMERIC(8, 4),
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_contrats_marche_tenant_numero UNIQUE (tenant_id, numero),
    CONSTRAINT chk_contrats_marche_type_marche CHECK (
        type_marche IN ('FORFAITAIRE', 'BPU', 'METRE_QUANTITATIF', 'MIXTE', 'REGIE')
    ),
    CONSTRAINT chk_contrats_marche_type_ccag CHECK (
        type_ccag_t IN ('TRAVAUX', 'SERVICE', 'FOURNITURE')
    ),
    CONSTRAINT chk_contrats_marche_status CHECK (
        status IN (
            'BROUILLON', 'NOTIFIE', 'EN_COURS',
            'RECEPTION_PROVISOIRE', 'RECEPTION_DEFINITIVE', 'CLOS'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_contrats_marche_tenant_status
    ON contrats_marche (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_contrats_marche_tenant_chantier
    ON contrats_marche (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_contrats_marche_tenant_client
    ON contrats_marche (tenant_id, client_id);

CREATE TABLE IF NOT EXISTS bpu_lignes (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    contrat_marche_id       VARCHAR(100) NOT NULL,
    poste_code              VARCHAR(50) NOT NULL,
    designation             VARCHAR(500) NOT NULL,
    unite                   VARCHAR(30) NOT NULL,
    quantite                NUMERIC(18, 4) NOT NULL DEFAULT 0,
    prix_unitaire_ht        NUMERIC(18, 4) NOT NULL DEFAULT 0,
    montant_ht              NUMERIC(18, 4),
    ordre                   INTEGER NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_bpu_lignes_contrat FOREIGN KEY (contrat_marche_id)
        REFERENCES contrats_marche (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bpu_lignes_tenant_contrat
    ON bpu_lignes (tenant_id, contrat_marche_id);
