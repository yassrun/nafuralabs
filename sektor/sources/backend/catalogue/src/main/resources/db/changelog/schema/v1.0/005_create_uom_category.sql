-- Auto-generated from uo-mcategory.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity uo-mcategory --feature item

CREATE TABLE IF NOT EXISTS uom_category (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(200) NOT NULL,
    description    TEXT,
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_uom_category_tenant ON uom_category(tenant_id);
CREATE INDEX IF NOT EXISTS idx_uom_category_code ON uom_category(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_uom_category_code_tenant ON uom_category(tenant_id, code);
