CREATE TABLE IF NOT EXISTS receptions_marche (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    contrat_marche_id       VARCHAR(100) NOT NULL,
    type                    VARCHAR(30) NOT NULL,
    date_reception          DATE NOT NULL,
    pv_reference            VARCHAR(100),
    status                  VARCHAR(30) NOT NULL DEFAULT 'VALIDE',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_receptions_marche_contrat FOREIGN KEY (contrat_marche_id)
        REFERENCES contrats_marche (id) ON DELETE CASCADE,
    CONSTRAINT chk_receptions_marche_type CHECK (
        type IN ('PROVISOIRE', 'DEFINITIVE')
    ),
    CONSTRAINT chk_receptions_marche_status CHECK (
        status IN ('VALIDE', 'ANNULEE')
    )
);

CREATE INDEX IF NOT EXISTS idx_receptions_marche_tenant_contrat
    ON receptions_marche (tenant_id, contrat_marche_id);

CREATE INDEX IF NOT EXISTS idx_receptions_marche_tenant_type
    ON receptions_marche (tenant_id, type);

CREATE TABLE IF NOT EXISTS reserves_reception (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    reception_id            VARCHAR(100) NOT NULL,
    libelle                 VARCHAR(500) NOT NULL,
    date_limite_levee       DATE,
    status                  VARCHAR(30) NOT NULL DEFAULT 'OUVERTE',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_reserves_reception_reception FOREIGN KEY (reception_id)
        REFERENCES receptions_marche (id) ON DELETE CASCADE,
    CONSTRAINT chk_reserves_reception_status CHECK (
        status IN ('OUVERTE', 'LEVEE')
    )
);

CREATE INDEX IF NOT EXISTS idx_reserves_reception_tenant_reception
    ON reserves_reception (tenant_id, reception_id);

CREATE INDEX IF NOT EXISTS idx_reserves_reception_tenant_status
    ON reserves_reception (tenant_id, status);
