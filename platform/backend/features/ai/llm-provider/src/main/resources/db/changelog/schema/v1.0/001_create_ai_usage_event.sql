CREATE TABLE IF NOT EXISTS ai_usage_event (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(255),
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    tokens_in BIGINT,
    tokens_out BIGINT,
    tokens_total BIGINT,
    cost_usd DECIMAL(12, 6),
    status VARCHAR(20) NOT NULL,
    error VARCHAR(2000),
    estimated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_event_tenant_id ON ai_usage_event(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_event_created_at ON ai_usage_event(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_event_tenant_idempotency ON ai_usage_event(tenant_id, idempotency_key);
