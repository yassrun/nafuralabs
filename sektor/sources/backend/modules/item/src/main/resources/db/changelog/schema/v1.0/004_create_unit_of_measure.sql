-- Auto-generated from unit-of-measure.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity unit-of-measure --feature item

CREATE TABLE IF NOT EXISTS unit_of_measure (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(30) NOT NULL,
    name           VARCHAR(100) NOT NULL,
    uom_category_id UUID,
    description    TEXT,
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unit_of_measure_tenant ON unit_of_measure(tenant_id);
CREATE INDEX IF NOT EXISTS idx_unit_of_measure_code ON unit_of_measure(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_unit_of_measure_code_tenant ON unit_of_measure(tenant_id, code);
