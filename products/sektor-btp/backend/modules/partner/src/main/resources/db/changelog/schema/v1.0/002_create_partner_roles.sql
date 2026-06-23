CREATE TABLE IF NOT EXISTS partner_roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    partner_id  UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    role        VARCHAR(30) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_partner_roles_partner_role UNIQUE (partner_id, role)
);

CREATE INDEX IF NOT EXISTS idx_partner_roles_tenant ON partner_roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_roles_partner ON partner_roles(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_roles_role ON partner_roles(tenant_id, role);
