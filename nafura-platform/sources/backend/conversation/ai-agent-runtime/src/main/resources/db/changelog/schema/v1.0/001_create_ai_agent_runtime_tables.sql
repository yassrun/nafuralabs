CREATE TABLE IF NOT EXISTS agent_run (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversation_session(id) ON DELETE CASCADE,
    application_id VARCHAR(120) NOT NULL,
    tenant_id VARCHAR(255),
    actor_sub VARCHAR(255) NOT NULL,
    scope_type VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL,
    prompt TEXT,
    model VARCHAR(120),
    llm_request_id VARCHAR(255),
    llm_cost_usd DECIMAL(12, 6),
    error TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_run_conversation_created
ON agent_run(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_run_app_actor
ON agent_run(application_id, actor_sub, updated_at DESC);

CREATE TABLE IF NOT EXISTS agent_action (
    id UUID PRIMARY KEY,
    run_id UUID NOT NULL REFERENCES agent_run(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversation_session(id) ON DELETE CASCADE,
    assistant_message_id UUID REFERENCES conversation_message(id) ON DELETE SET NULL,
    tool_key VARCHAR(120) NOT NULL,
    title VARCHAR(255),
    action_key VARCHAR(120),
    permission_key VARCHAR(255),
    entitlement_key VARCHAR(255),
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL,
    args_json TEXT,
    result_json TEXT,
    error TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_action_conversation_status
ON agent_action(conversation_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_action_run
ON agent_action(run_id, created_at ASC);

CREATE TABLE IF NOT EXISTS agent_approval (
    id UUID PRIMARY KEY,
    action_id UUID NOT NULL REFERENCES agent_action(id) ON DELETE CASCADE,
    decision VARCHAR(20) NOT NULL,
    comment TEXT,
    decided_by VARCHAR(255) NOT NULL,
    decided_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_approval_action
ON agent_approval(action_id, decided_at DESC);

CREATE TABLE IF NOT EXISTS agent_execution_log (
    id UUID PRIMARY KEY,
    action_id UUID NOT NULL REFERENCES agent_action(id) ON DELETE CASCADE,
    phase VARCHAR(30) NOT NULL,
    payload_json TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_execution_log_action
ON agent_execution_log(action_id, created_at ASC);
