-- Personal listing saved views (tenant-scoped, V1 private)

CREATE TABLE IF NOT EXISTS listing_saved_views (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    owner_user_id UUID NOT NULL,
    resource_key VARCHAR(120) NOT NULL,
    name VARCHAR(200) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    query_json TEXT NOT NULL,
    version      BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_listing_saved_views_tenant_owner_resource
    ON listing_saved_views (tenant_id, owner_user_id, resource_key);

CREATE UNIQUE INDEX IF NOT EXISTS uq_listing_saved_views_tenant_owner_resource_name
    ON listing_saved_views (tenant_id, owner_user_id, resource_key, name);
