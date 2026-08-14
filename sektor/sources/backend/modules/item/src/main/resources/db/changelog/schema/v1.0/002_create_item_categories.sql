-- Auto-generated from item-category.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity item-category --feature item

CREATE TABLE IF NOT EXISTS item_categories (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    parent_id      UUID,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_item_categories_tenant ON item_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_item_categories_code ON item_categories(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_item_categories_code_tenant ON item_categories(tenant_id, code);
