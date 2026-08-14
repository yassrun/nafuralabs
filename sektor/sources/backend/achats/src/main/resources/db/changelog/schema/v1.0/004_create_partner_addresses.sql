CREATE TABLE IF NOT EXISTS partner_addresses (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    partner_id   UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    type         VARCHAR(30) NOT NULL,
    ligne1       VARCHAR(255),
    ligne2       VARCHAR(255),
    ville        VARCHAR(100),
    code_postal  VARCHAR(20),
    pays         VARCHAR(2) DEFAULT 'MA',
    is_default   BOOLEAN DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_addresses_tenant ON partner_addresses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_addresses_partner ON partner_addresses(partner_id);
