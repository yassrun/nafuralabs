-- Authorization module: Create tenant_user_role table for tenant-scoped roles.

CREATE TABLE IF NOT EXISTS tenant_user_role (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_tenant_user_role_tenant_user_role UNIQUE (tenant_id, user_id, role_code)
);

CREATE INDEX IF NOT EXISTS idx_tenant_user_role_tenant_id ON tenant_user_role(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_role_user_id ON tenant_user_role(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_role_role_code ON tenant_user_role(role_code);
