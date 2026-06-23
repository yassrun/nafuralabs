-- ERP onboarding v2: user progress + tenant preset tracking

CREATE TABLE IF NOT EXISTS user_onboarding_state (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    current_step INT NOT NULL DEFAULT 0,
    answers_json TEXT,
    tenant_id UUID,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_onboarding_state_user UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_state_user_id ON user_onboarding_state(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_state_tenant_id ON user_onboarding_state(tenant_id);

CREATE TABLE IF NOT EXISTS tenant_onboarding_meta (
    tenant_id UUID PRIMARY KEY,
    preset_applied_at TIMESTAMP WITH TIME ZONE,
    preset_payload_hash VARCHAR(64),
    preset_profile_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
