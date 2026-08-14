-- Tenant-admin / app-settings: Create tenant_setting table for general, localization, branding.

CREATE TABLE IF NOT EXISTS tenant_setting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    setting_key VARCHAR(120) NOT NULL,
    value VARCHAR(4000)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_setting_tenant_key ON tenant_setting(tenant_id, setting_key);
