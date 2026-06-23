-- Scope module: create generic app scope table used for data partitioning.

CREATE TABLE IF NOT EXISTS app_scope (
    id UUID PRIMARY KEY,
    scope_key VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'APP_DEFAULT',
    application_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_app_scope_application_key UNIQUE (application_id, scope_key)
);

CREATE INDEX IF NOT EXISTS idx_app_scope_application_id ON app_scope(application_id);
CREATE INDEX IF NOT EXISTS idx_app_scope_scope_key ON app_scope(scope_key);
