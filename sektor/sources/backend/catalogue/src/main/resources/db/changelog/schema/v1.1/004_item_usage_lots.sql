-- Classification ERP-25: lots d'usage multi par article (axe disjoint des familles d'appro).
-- Voir docs/epics/classification-article/01-ADR-decisions-ouvertes.md §7.4

CREATE TABLE IF NOT EXISTS item_usage_lots (
    item_id    UUID         NOT NULL,
    tenant_id  UUID         NOT NULL,
    lot_code   VARCHAR(50)  NOT NULL,
    PRIMARY KEY (item_id, lot_code)
);

CREATE INDEX IF NOT EXISTS idx_item_usage_lots_tenant_lot
    ON item_usage_lots (tenant_id, lot_code);

CREATE INDEX IF NOT EXISTS idx_item_usage_lots_item
    ON item_usage_lots (item_id);
