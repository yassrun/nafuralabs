-- Authorization module: Create user_role table for global (non-tenant) roles

CREATE TABLE IF NOT EXISTS user_role (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    role_code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_role_user_role UNIQUE (user_id, role_code)
);

CREATE INDEX IF NOT EXISTS idx_user_role_user_id ON user_role(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_role_code ON user_role(role_code);
