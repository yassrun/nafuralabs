CREATE TABLE IF NOT EXISTS avenants (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    contrat_marche_id       VARCHAR(100) NOT NULL,
    marche_numero           VARCHAR(50) NOT NULL,
    type                    VARCHAR(40) NOT NULL,
    objet                   VARCHAR(500) NOT NULL,
    motif                   TEXT,
    montant_ht              NUMERIC(18, 4) NOT NULL DEFAULT 0,
    prolongation_jours      INTEGER NOT NULL DEFAULT 0,
    date_signature          DATE,
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    impact_propage_le       TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_avenants_tenant_numero UNIQUE (tenant_id, numero),
    CONSTRAINT fk_avenants_contrat FOREIGN KEY (contrat_marche_id)
        REFERENCES contrats_marche (id) ON DELETE CASCADE,
    CONSTRAINT chk_avenants_type CHECK (
        type IN (
            'TVX_SUPPLEMENTAIRES', 'PROLONGATION_DELAI', 'ADAPTATION_TECHNIQUE',
            'MONTANT', 'DELAI', 'MIXTE'
        )
    ),
    CONSTRAINT chk_avenants_status CHECK (
        status IN (
            'BROUILLON', 'EN_SIGNATURE', 'SIGNE', 'APPLIQUE', 'ANNULE', 'PROPOSE'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_avenants_tenant_contrat
    ON avenants (tenant_id, contrat_marche_id);

CREATE INDEX IF NOT EXISTS idx_avenants_tenant_status
    ON avenants (tenant_id, status);
