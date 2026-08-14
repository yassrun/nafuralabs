-- Tenant-admin / app-settings: Create tenant_asset table for logo/favicon uploads.

CREATE TABLE IF NOT EXISTS tenant_asset (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    content_type VARCHAR(100),
    data BYTEA
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_asset_tenant_type ON tenant_asset(tenant_id, asset_type);
