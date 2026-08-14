-- Auto-generated from calendar.entity.json
-- Do not edit manually — regenerate with: node generate.mjs --entity calendar --feature sysconfig

CREATE TABLE IF NOT EXISTS calendar (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(200) NOT NULL,
    time_zone_id   VARCHAR(50),
    description    TEXT,
    is_active      BOOLEAN DEFAULT true,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_tenant ON calendar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_code ON calendar(tenant_id, code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_calendar_code_tenant ON calendar(tenant_id, code);
