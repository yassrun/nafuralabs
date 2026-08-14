CREATE TABLE IF NOT EXISTS cautions_marche (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    contrat_marche_id       VARCHAR(100) NOT NULL,
    marche_numero           VARCHAR(50),
    type                    VARCHAR(30) NOT NULL,
    banque_partner_id       VARCHAR(100),
    banque_nom              VARCHAR(255),
    montant                 NUMERIC(18, 4) NOT NULL DEFAULT 0,
    date_emission           DATE,
    date_expiration         DATE,
    status                  VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    scan_url                VARCHAR(500),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_cautions_marche_tenant_numero UNIQUE (tenant_id, numero),
    CONSTRAINT fk_cautions_marche_contrat FOREIGN KEY (contrat_marche_id)
        REFERENCES contrats_marche (id) ON DELETE CASCADE,
    CONSTRAINT chk_cautions_marche_type CHECK (
        type IN ('PROVISOIRE', 'DEFINITIVE', 'RG', 'AVANCE')
    ),
    CONSTRAINT chk_cautions_marche_status CHECK (
        status IN ('ACTIVE', 'RENOUVELEE', 'MAINLEVEE', 'EXPIRE', 'EN_MAINLEVEE')
    )
);

CREATE INDEX IF NOT EXISTS idx_cautions_marche_tenant_contrat
    ON cautions_marche (tenant_id, contrat_marche_id);

CREATE INDEX IF NOT EXISTS idx_cautions_marche_tenant_status
    ON cautions_marche (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_cautions_marche_tenant_expiration
    ON cautions_marche (tenant_id, date_expiration);
