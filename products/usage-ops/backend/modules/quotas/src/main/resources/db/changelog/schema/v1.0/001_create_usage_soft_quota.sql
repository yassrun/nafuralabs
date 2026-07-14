--liquibase formatted sql

--changeset usage-ops:001_create_usage_soft_quota
CREATE TABLE IF NOT EXISTS usage_soft_quota (
    id            UUID PRIMARY KEY,
    tenant_id     VARCHAR(100),
    metric_key    VARCHAR(80) NOT NULL,
    soft_limit    NUMERIC(24, 6) NOT NULL,
    warn_percent  INTEGER NOT NULL DEFAULT 80,
    product_id    VARCHAR(80),
    enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_soft_quota_tenant ON usage_soft_quota (tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_soft_quota_metric ON usage_soft_quota (metric_key);
