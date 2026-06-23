CREATE TABLE IF NOT EXISTS partner_contacts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    partner_id  UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    nom         VARCHAR(255) NOT NULL,
    fonction    VARCHAR(100),
    email       VARCHAR(255),
    telephone   VARCHAR(50),
    is_primary  BOOLEAN DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_contacts_tenant ON partner_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_partner ON partner_contacts(partner_id);
