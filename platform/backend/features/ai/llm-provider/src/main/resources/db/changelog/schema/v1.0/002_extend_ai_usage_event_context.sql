ALTER TABLE ai_usage_event
    ADD COLUMN IF NOT EXISTS scope_key VARCHAR(300),
    ADD COLUMN IF NOT EXISTS scope_type VARCHAR(20) NOT NULL DEFAULT 'TENANT',
    ADD COLUMN IF NOT EXISTS application_id VARCHAR(120),
    ADD COLUMN IF NOT EXISTS domain_key VARCHAR(120),
    ADD COLUMN IF NOT EXISTS feature_key VARCHAR(120),
    ADD COLUMN IF NOT EXISTS resource_key VARCHAR(120),
    ADD COLUMN IF NOT EXISTS action_key VARCHAR(120),
    ADD COLUMN IF NOT EXISTS mode VARCHAR(20) NOT NULL DEFAULT 'ASK',
    ADD COLUMN IF NOT EXISTS conversation_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS message_id VARCHAR(255),
    ADD COLUMN IF NOT EXISTS actor_sub VARCHAR(255),
    ADD COLUMN IF NOT EXISTS response_content TEXT,
    ADD COLUMN IF NOT EXISTS latency_ms BIGINT;

UPDATE ai_usage_event
SET scope_key = CASE
    WHEN tenant_id IS NOT NULL THEN 'TENANT:default:' || tenant_id
    ELSE 'GLOBAL:default:legacy'
END
WHERE scope_key IS NULL;

ALTER TABLE ai_usage_event
    ALTER COLUMN scope_key SET NOT NULL;

ALTER TABLE ai_usage_event
    ALTER COLUMN tenant_id DROP NOT NULL;

DROP INDEX IF EXISTS idx_ai_usage_event_tenant_idempotency;
DROP INDEX IF EXISTS idx_tenant_idempotency;

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_event_scope_idempotency
ON ai_usage_event(scope_key, idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_usage_event_application
ON ai_usage_event(application_id);

CREATE INDEX IF NOT EXISTS idx_ai_usage_event_domain_feature
ON ai_usage_event(domain_key, feature_key);
