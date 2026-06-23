CREATE TABLE IF NOT EXISTS payment_modes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(30) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_modes_tenant_code ON payment_modes(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_payment_modes_tenant ON payment_modes(tenant_id);
