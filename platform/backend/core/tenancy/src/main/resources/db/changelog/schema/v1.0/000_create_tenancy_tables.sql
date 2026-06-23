-- Tenancy module: Create core tenancy tables for clean installations.

CREATE TABLE IF NOT EXISTS tenant (
    id UUID PRIMARY KEY,
    key VARCHAR(100) UNIQUE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50),
    owner_email VARCHAR(255),
    application_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_key ON tenant(key);

CREATE TABLE IF NOT EXISTS tenant_domain (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    domain_code VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_tenant_domain_tenant_domain_code UNIQUE (tenant_id, domain_code)
);

CREATE INDEX IF NOT EXISTS idx_tenant_domain_tenant_id ON tenant_domain(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domain_domain_code ON tenant_domain(domain_code);
CREATE INDEX IF NOT EXISTS idx_tenant_domain_status ON tenant_domain(status);

CREATE TABLE IF NOT EXISTS tenant_membership (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_tenant_membership_tenant_user UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_membership_tenant_id ON tenant_membership(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_membership_user_id ON tenant_membership(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_membership_status ON tenant_membership(status);
