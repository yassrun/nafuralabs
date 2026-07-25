CREATE TABLE IF NOT EXISTS ai_usage_event (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(255),
    idempotency_key VARCHAR(255),
    scope_key VARCHAR(300) NOT NULL,
    scope_type VARCHAR(20) NOT NULL DEFAULT 'TENANT',
    application_id VARCHAR(120),
    domain_key VARCHAR(120),
    feature_key VARCHAR(120),
    resource_key VARCHAR(120),
    action_key VARCHAR(120),
    mode VARCHAR(20) NOT NULL DEFAULT 'ASK',
    conversation_id VARCHAR(255),
    message_id VARCHAR(255),
    actor_sub VARCHAR(255),
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    tokens_in BIGINT,
    tokens_out BIGINT,
    tokens_total BIGINT,
    cost_usd DECIMAL(12, 6),
    status VARCHAR(20) NOT NULL,
    error VARCHAR(2000),
    response_content TEXT,
    latency_ms BIGINT,
    estimated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_event_tenant_id ON ai_usage_event(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_event_created_at ON ai_usage_event(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_event_application ON ai_usage_event(application_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_event_domain_feature ON ai_usage_event(domain_key, feature_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_event_scope_idempotency
ON ai_usage_event(scope_key, idempotency_key)
WHERE idempotency_key IS NOT NULL;
