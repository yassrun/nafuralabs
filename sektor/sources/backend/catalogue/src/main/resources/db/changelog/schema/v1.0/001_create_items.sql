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
    article_type   VARCHAR(30),
    poste_budget_id VARCHAR(50),
    default_location_id UUID,
    is_perissable  BOOLEAN DEFAULT false,
    abc_class      VARCHAR(1),
    pmp            NUMERIC(18,4),
    -- Deprecated (lot-9): prices now live in item_prices; kept for backward compatibility.
    prix_unitaire  NUMERIC(18,4),
    stock_min      NUMERIC(18,4),
    stock_max      NUMERIC(18,4),
    delai_reappro_jours INTEGER,
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_tenant ON items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_items_code ON items(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_items_code_tenant ON items(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_items_article_type ON items(tenant_id, article_type);
CREATE INDEX IF NOT EXISTS idx_items_poste_budget ON items(tenant_id, poste_budget_id);
