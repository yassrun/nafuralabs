CREATE TABLE IF NOT EXISTS partner_bank_accounts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    partner_id  UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    banque      VARCHAR(100),
    rib         VARCHAR(24) NOT NULL,
    is_default  BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_bank_accounts_tenant ON partner_bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_bank_accounts_partner ON partner_bank_accounts(partner_id);
