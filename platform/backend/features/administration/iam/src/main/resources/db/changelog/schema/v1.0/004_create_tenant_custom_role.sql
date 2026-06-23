-- Custom roles per tenant (non-system roles).

CREATE TABLE IF NOT EXISTS tenant_custom_role (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_tenant_custom_role_tenant_code ON tenant_custom_role(tenant_id, role_code);
CREATE INDEX IF NOT EXISTS idx_tenant_custom_role_tenant_id ON tenant_custom_role(tenant_id);

-- Permissions for custom roles (tenant-scoped).

CREATE TABLE IF NOT EXISTS tenant_custom_role_permission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    permission VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_tenant_custom_role_perm ON tenant_custom_role_permission(tenant_id, role_code, permission);
CREATE INDEX IF NOT EXISTS idx_tenant_custom_role_perm_tenant_role ON tenant_custom_role_permission(tenant_id, role_code);
