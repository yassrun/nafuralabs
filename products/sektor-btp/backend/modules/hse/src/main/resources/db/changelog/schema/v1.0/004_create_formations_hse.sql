CREATE TABLE IF NOT EXISTS formations_hse (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    titre                   VARCHAR(500) NOT NULL,
    date_debut              DATE NOT NULL,
    date_fin                DATE,
    duree_heures            INTEGER NOT NULL DEFAULT 0,
    formateur               VARCHAR(255),
    lieu                    VARCHAR(500),
    nb_participants         INTEGER NOT NULL DEFAULT 0,
    habilitation_code       VARCHAR(50),
    attestation_reference   VARCHAR(100),
    attestation_validite    DATE,
    status                  VARCHAR(30) NOT NULL DEFAULT 'PLANIFIEE',
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_formations_hse_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_formations_hse_tenant_status
    ON formations_hse (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_formations_hse_tenant_attestation_validite
    ON formations_hse (tenant_id, attestation_validite);

CREATE TABLE IF NOT EXISTS formation_hse_participants (
    formation_id            VARCHAR(100) NOT NULL REFERENCES formations_hse (id) ON DELETE CASCADE,
    participant             VARCHAR(255) NOT NULL,
    PRIMARY KEY (formation_id, participant)
);
