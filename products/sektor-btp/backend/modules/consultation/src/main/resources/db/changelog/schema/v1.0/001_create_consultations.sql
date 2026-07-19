CREATE TABLE IF NOT EXISTS consultations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    objet                   VARCHAR(500) NOT NULL,
    chantier_id             VARCHAR(100),
    chantier_code           VARCHAR(50),
    chantier_name           VARCHAR(255),
    cps_document_id         VARCHAR(100),
    bordereau_document_id   VARCHAR(100),
    status                  VARCHAR(30) NOT NULL DEFAULT 'BROUILLON',
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_consultations_tenant_numero UNIQUE (tenant_id, numero)
);

CREATE INDEX IF NOT EXISTS idx_consultations_tenant_status
    ON consultations(tenant_id, status);
