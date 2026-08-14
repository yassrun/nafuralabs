-- Stock Lot 1: grand livre stock_moves + UNIQUE soldes + mouvements d'ouverture
-- Voir docs/epics/stock-raffinement/00-PLAN.md §5 Lot 1 / ADR §7.3

CREATE TABLE IF NOT EXISTS stock_moves (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID NOT NULL,
    inventory_tx_id       UUID,
    inventory_tx_line_id  UUID,
    location_id           UUID NOT NULL,
    item_id               UUID NOT NULL,
    quantity              NUMERIC(18,4) NOT NULL,
    unit_cost             NUMERIC(18,4),
    total_cost            NUMERIC(18,4),
    moved_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by            VARCHAR(100),
    reversal_of_move_id   UUID,
    is_opening            BOOLEAN NOT NULL DEFAULT false,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_moves_tenant_item_loc_moved
    ON stock_moves (tenant_id, item_id, location_id, moved_at);
CREATE INDEX IF NOT EXISTS idx_stock_moves_tenant_tx
    ON stock_moves (tenant_id, inventory_tx_id);
CREATE INDEX IF NOT EXISTS idx_stock_moves_reversal
    ON stock_moves (tenant_id, reversal_of_move_id);

-- Dédoublonner stock_balances avant UNIQUE (garde la ligne la plus récente / qty max)
WITH ranked AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY tenant_id, warehouse_id, item_id
               ORDER BY updated_at DESC NULLS LAST, quantity DESC NULLS LAST, id
           ) AS rn
    FROM stock_balances
)
DELETE FROM stock_balances sb
USING ranked r
WHERE sb.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_balances_tenant_warehouse_item
    ON stock_balances (tenant_id, warehouse_id, item_id);

-- Mouvements d'ouverture pour soldes existants sans grand livre
INSERT INTO stock_moves (
    id, tenant_id, inventory_tx_id, inventory_tx_line_id,
    location_id, item_id, quantity, unit_cost, total_cost,
    moved_at, created_by, reversal_of_move_id, is_opening, created_at
)
SELECT
    gen_random_uuid(),
    sb.tenant_id,
    NULL,
    NULL,
    sb.warehouse_id,
    sb.item_id,
    sb.quantity,
    NULL,
    NULL,
    COALESCE(sb.created_at, now()),
    'opening-balance',
    NULL,
    true,
    now()
FROM stock_balances sb
WHERE sb.quantity IS NOT NULL
  AND sb.quantity <> 0
  AND NOT EXISTS (
      SELECT 1 FROM stock_moves sm
      WHERE sm.tenant_id = sb.tenant_id
        AND sm.location_id = sb.warehouse_id
        AND sm.item_id = sb.item_id
  );
