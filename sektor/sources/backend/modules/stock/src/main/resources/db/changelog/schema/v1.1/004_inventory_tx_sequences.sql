-- Stock Lot 5: séquence de numérotation par tenant / type / exercice
-- Voir docs/epics/stock-raffinement/00-PLAN.md §5 Lot 5

CREATE TABLE IF NOT EXISTS inventory_tx_sequences (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    tx_type     VARCHAR(50) NOT NULL,
    exercice    INT NOT NULL,
    last_value  BIGINT NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_inventory_tx_sequences UNIQUE (tenant_id, tx_type, exercice)
);
