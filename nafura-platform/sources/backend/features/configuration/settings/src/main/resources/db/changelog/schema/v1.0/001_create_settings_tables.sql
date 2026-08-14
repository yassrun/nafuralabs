-- Settings module: definitions + scoped runtime values.
-- This module is tenant-optional by design (no FK to tenant/user tables).

CREATE TABLE IF NOT EXISTS setting_definition (
    id UUID PRIMARY KEY,
    setting_key VARCHAR(200) NOT NULL UNIQUE,
    owner_level VARCHAR(20) NOT NULL,
    application_id VARCHAR(80),
    domain_code VARCHAR(80),
    feature_code VARCHAR(80),
    value_type VARCHAR(20) NOT NULL,
    default_value TEXT,
    description VARCHAR(500),
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    is_mutable BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_setting_definition_owner
    ON setting_definition(owner_level, application_id, domain_code, feature_code);
CREATE INDEX IF NOT EXISTS idx_setting_definition_active
    ON setting_definition(is_active);

CREATE TABLE IF NOT EXISTS setting_definition_scope (
    id UUID PRIMARY KEY,
    setting_key VARCHAR(200) NOT NULL,
    scope_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_setting_definition_scope UNIQUE (setting_key, scope_type)
);

CREATE INDEX IF NOT EXISTS idx_setting_definition_scope_key
    ON setting_definition_scope(setting_key);
CREATE INDEX IF NOT EXISTS idx_setting_definition_scope_type
    ON setting_definition_scope(scope_type);

CREATE TABLE IF NOT EXISTS setting_value (
    id UUID PRIMARY KEY,
    application_id VARCHAR(80) NOT NULL,
    setting_key VARCHAR(200) NOT NULL,
    scope_type VARCHAR(20) NOT NULL,
    scope_key VARCHAR(320) NOT NULL,
    value TEXT NOT NULL,
    updated_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_setting_value_scope UNIQUE (application_id, setting_key, scope_type, scope_key)
);

CREATE INDEX IF NOT EXISTS idx_setting_value_lookup
    ON setting_value(application_id, setting_key, scope_type, scope_key);
CREATE INDEX IF NOT EXISTS idx_setting_value_setting_key
    ON setting_value(setting_key);
