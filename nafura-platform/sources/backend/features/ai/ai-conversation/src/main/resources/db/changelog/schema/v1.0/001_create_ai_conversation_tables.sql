CREATE TABLE IF NOT EXISTS conversation_session (
    id UUID PRIMARY KEY,
    application_id VARCHAR(120) NOT NULL,
    tenant_id VARCHAR(255),
    actor_sub VARCHAR(255) NOT NULL,
    scope_type VARCHAR(20) NOT NULL,
    mode VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    title VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversation_session_app_actor
ON conversation_session(application_id, actor_sub, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_session_tenant
ON conversation_session(tenant_id);

CREATE TABLE IF NOT EXISTS conversation_message (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversation_session(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    metadata_json TEXT,
    request_id VARCHAR(255),
    tokens_in BIGINT,
    tokens_out BIGINT,
    tokens_total BIGINT,
    cost_usd DECIMAL(12, 6),
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_conversation_message_conversation_created
ON conversation_message(conversation_id, created_at ASC);
