CREATE TABLE IF NOT EXISTS stock_reservations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL,
    item_id          UUID NOT NULL,
    quantity         NUMERIC(18,4) NOT NULL,
    uom              VARCHAR(20),
    chantier_id      VARCHAR(50) NOT NULL,
    date_besoin      DATE NOT NULL,
    date_expiration  DATE NOT NULL,
    date_creation    DATE NOT NULL,
    created_by       VARCHAR(100),
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    motif            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_tenant ON stock_reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_chantier ON stock_reservations(tenant_id, chantier_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_item ON stock_reservations(tenant_id, item_id, chantier_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_expiration ON stock_reservations(tenant_id, status, date_expiration);
