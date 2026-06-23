CREATE TABLE IF NOT EXISTS penalites_marche (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    contrat_marche_id       VARCHAR(100) NOT NULL,
    marche_numero           VARCHAR(50),
    type                    VARCHAR(30) NOT NULL,
    motif                   VARCHAR(500),
    montant_ht              NUMERIC(18, 4) NOT NULL DEFAULT 0,
    jours_retard            INTEGER,
    date_constat            DATE,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_penalites_marche_tenant_numero UNIQUE (tenant_id, numero),
    CONSTRAINT fk_penalites_marche_contrat FOREIGN KEY (contrat_marche_id)
        REFERENCES contrats_marche (id) ON DELETE CASCADE,
    CONSTRAINT chk_penalites_marche_type CHECK (
        type IN ('RETARD', 'QUALITE', 'AUTRE')
    ),
    CONSTRAINT chk_penalites_marche_status CHECK (
        status IN ('BROUILLON', 'VALIDEE', 'ANNULEE')
    )
);

CREATE INDEX IF NOT EXISTS idx_penalites_marche_tenant_contrat
    ON penalites_marche (tenant_id, contrat_marche_id);

CREATE INDEX IF NOT EXISTS idx_penalites_marche_tenant_status
    ON penalites_marche (tenant_id, status);
