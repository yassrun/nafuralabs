-- Subscription module: SaaS + on-prem capable subscription and entitlement model.
-- This module is tenant-optional and references owners by type/id without hard FKs.

CREATE TABLE IF NOT EXISTS subscription_plan (
    id UUID PRIMARY KEY,
    application_id VARCHAR(80) NOT NULL,
    plan_code VARCHAR(80) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    scope VARCHAR(20) NOT NULL,
    delivery_model VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_builtin BOOLEAN NOT NULL DEFAULT TRUE,
    metadata_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_subscription_plan_app_code UNIQUE (application_id, plan_code)
);

CREATE INDEX IF NOT EXISTS idx_subscription_plan_application
    ON subscription_plan(application_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_scope
    ON subscription_plan(scope);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_model
    ON subscription_plan(delivery_model);

CREATE TABLE IF NOT EXISTS subscription_entitlement (
    id UUID PRIMARY KEY,
    application_id VARCHAR(80) NOT NULL,
    plan_code VARCHAR(80) NOT NULL,
    entitlement_key VARCHAR(180) NOT NULL,
    value_type VARCHAR(20) NOT NULL,
    value_json TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_subscription_entitlement UNIQUE (application_id, plan_code, entitlement_key)
);

CREATE INDEX IF NOT EXISTS idx_subscription_entitlement_lookup
    ON subscription_entitlement(application_id, plan_code, entitlement_key);

CREATE TABLE IF NOT EXISTS subscription_assignment (
    id UUID PRIMARY KEY,
    application_id VARCHAR(80) NOT NULL,
    owner_type VARCHAR(20) NOT NULL,
    owner_id UUID NOT NULL,
    plan_code VARCHAR(80) NOT NULL,
    status VARCHAR(20) NOT NULL,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    external_ref VARCHAR(120),
    metadata_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_subscription_assignment UNIQUE (application_id, owner_type, owner_id, plan_code)
);

CREATE INDEX IF NOT EXISTS idx_subscription_assignment_owner
    ON subscription_assignment(application_id, owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_subscription_assignment_status
    ON subscription_assignment(status);

CREATE TABLE IF NOT EXISTS on_prem_license (
    id UUID PRIMARY KEY,
    application_id VARCHAR(80) NOT NULL,
    assignment_id UUID,
    license_key_hash VARCHAR(128) NOT NULL,
    deployment_id VARCHAR(120),
    status VARCHAR(20) NOT NULL,
    issued_to VARCHAR(255),
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_to TIMESTAMP WITH TIME ZONE,
    max_users INTEGER,
    max_tenants INTEGER,
    claims_json TEXT,
    signature VARCHAR(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_on_prem_license_hash UNIQUE (application_id, license_key_hash)
);

CREATE INDEX IF NOT EXISTS idx_on_prem_license_assignment
    ON on_prem_license(application_id, assignment_id);
CREATE INDEX IF NOT EXISTS idx_on_prem_license_status
    ON on_prem_license(status);
