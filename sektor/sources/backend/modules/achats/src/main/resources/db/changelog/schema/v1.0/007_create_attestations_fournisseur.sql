CREATE TABLE IF NOT EXISTS attestations_fournisseur (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    partner_id          VARCHAR(100) NOT NULL,
    type                VARCHAR(20) NOT NULL,
    date_emission       DATE NOT NULL,
    date_expiration     DATE NOT NULL,
    scan_url            TEXT,
    status              VARCHAR(20) NOT NULL DEFAULT 'VALIDE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_attestations_fournisseur_tenant_partner_type
        UNIQUE (tenant_id, partner_id, type),
    CONSTRAINT chk_attestations_fournisseur_type CHECK (
        type IN ('CNSS', 'FISCALE', 'AMO', 'RC', 'IF', 'ICE', 'PATENTE', 'RIB')
    ),
    CONSTRAINT chk_attestations_fournisseur_status CHECK (
        status IN ('VALIDE', 'EXPIRE_BIENTOT', 'EXPIRE')
    )
);

CREATE INDEX IF NOT EXISTS idx_attestations_fournisseur_tenant_partner
    ON attestations_fournisseur(tenant_id, partner_id);

CREATE INDEX IF NOT EXISTS idx_attestations_fournisseur_tenant_status
    ON attestations_fournisseur(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_attestations_fournisseur_tenant_partner_status
    ON attestations_fournisseur(tenant_id, partner_id, status);
