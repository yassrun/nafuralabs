CREATE TABLE IF NOT EXISTS ordres_service (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    contrat_marche_id       VARCHAR(100) NOT NULL,
    chantier_id             VARCHAR(100),
    chantier_code           VARCHAR(50),
    type                    VARCHAR(30) NOT NULL,
    date_emission           DATE,
    emetteur                VARCHAR(30),
    objet                   VARCHAR(255),
    description             TEXT,
    impact_delai            INTEGER,
    impact_cout             NUMERIC(18, 4),
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    date_accuse_reception   DATE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_ordres_service_tenant_numero UNIQUE (tenant_id, numero),
    CONSTRAINT fk_ordres_service_contrat FOREIGN KEY (contrat_marche_id)
        REFERENCES contrats_marche (id) ON DELETE CASCADE,
    CONSTRAINT chk_ordres_service_type CHECK (
        type IN ('COMMENCEMENT', 'ARRET', 'REPRISE', 'MODIFICATION', 'NOTIFICATION')
    ),
    CONSTRAINT chk_ordres_service_status CHECK (
        status IN ('BROUILLON', 'EMIS', 'RECEPTIONNE', 'ANNULE')
    )
);

CREATE INDEX IF NOT EXISTS idx_ordres_service_tenant_contrat
    ON ordres_service (tenant_id, contrat_marche_id);

CREATE INDEX IF NOT EXISTS idx_ordres_service_tenant_status
    ON ordres_service (tenant_id, status);
