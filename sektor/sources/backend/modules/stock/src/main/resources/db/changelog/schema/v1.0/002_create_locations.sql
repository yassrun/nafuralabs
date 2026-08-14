-- Auto-generated from location.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity location --feature stock

CREATE TABLE IF NOT EXISTS locations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(200) NOT NULL,
    type           VARCHAR(30) NOT NULL,
    parent_location_id UUID,
    is_physical    BOOLEAN NOT NULL DEFAULT TRUE,
    affects_stock  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_locations_tenant ON locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_locations_code_tenant ON locations(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(tenant_id, type);
