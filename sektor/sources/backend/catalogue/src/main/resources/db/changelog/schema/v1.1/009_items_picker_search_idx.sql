-- SEKTOR-142 — picker search (nature / famille) without scanning the tenant dump.
CREATE INDEX IF NOT EXISTS idx_items_picker_active_nature
    ON items (tenant_id, is_active, nature);

CREATE INDEX IF NOT EXISTS idx_items_picker_category
    ON items (tenant_id, item_category_id);
