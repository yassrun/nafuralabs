-- Audit: audit_events, integration_errors

CREATE TABLE IF NOT EXISTS audit_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id   UUID NOT NULL,
    action      VARCHAR(80) NOT NULL,
    actor       VARCHAR(120) NOT NULL,
    event_at    TIMESTAMPTZ NOT NULL,
    details     TEXT,
    payload     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_entity ON audit_events(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_at ON audit_events(event_at);

CREATE TABLE IF NOT EXISTS integration_errors (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    error_number  VARCHAR(60) NOT NULL,
    source        VARCHAR(120) NOT NULL,
    error_type    VARCHAR(80) NOT NULL,
    payload       JSONB,
    error_message TEXT NOT NULL,
    occurred_at   TIMESTAMPTZ NOT NULL,
    retry_count   INT,
    resolved_at   TIMESTAMPTZ,
    status        VARCHAR(30) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_integration_errors_tenant ON integration_errors(tenant_id);
