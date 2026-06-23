CREATE TABLE IF NOT EXISTS indices_btp (
    id          VARCHAR(100) PRIMARY KEY,
    tenant_id   UUID NOT NULL,
    code        VARCHAR(20) NOT NULL,
    periode     VARCHAR(7) NOT NULL,
    valeur      NUMERIC(18, 6) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_indices_btp_tenant_code_periode UNIQUE (tenant_id, code, periode),
    CONSTRAINT chk_indices_btp_periode CHECK (periode ~ '^\d{4}-\d{2}$')
);

CREATE INDEX IF NOT EXISTS idx_indices_btp_tenant_periode
    ON indices_btp (tenant_id, periode);

CREATE TABLE IF NOT EXISTS revisions_prix (
    id                  VARCHAR(100) PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    contrat_marche_id   VARCHAR(100) NOT NULL,
    periode             VARCHAR(7) NOT NULL,
    coefficient_k       NUMERIC(18, 8),
    montant_revision    NUMERIC(18, 4),
    formule_json        TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'CALCULE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_revisions_prix_tenant_contrat_periode UNIQUE (tenant_id, contrat_marche_id, periode),
    CONSTRAINT fk_revisions_prix_contrat FOREIGN KEY (contrat_marche_id)
        REFERENCES contrats_marche (id) ON DELETE CASCADE,
    CONSTRAINT chk_revisions_prix_status CHECK (
        status IN ('CALCULE', 'APPLIQUE', 'ANNULE')
    ),
    CONSTRAINT chk_revisions_prix_periode CHECK (periode ~ '^\d{4}-\d{2}$')
);

CREATE INDEX IF NOT EXISTS idx_revisions_prix_tenant_contrat
    ON revisions_prix (tenant_id, contrat_marche_id);
