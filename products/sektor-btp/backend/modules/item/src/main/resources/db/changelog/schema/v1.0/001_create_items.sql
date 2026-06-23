-- Auto-generated from item.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity item --feature item

CREATE TABLE IF NOT EXISTS items (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(50),
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    item_type_id   UUID,
    item_category_id UUID,
    unit_of_measure_id UUID,
    sku            VARCHAR(100),
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_tenant ON items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_items_code ON items(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_items_code_tenant ON items(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(tenant_id, sku);
