--liquibase formatted sql

--changeset usage-ops:001_create_usage_alert_tables
CREATE TABLE IF NOT EXISTS usage_alert_event (
    id           UUID PRIMARY KEY,
    alert_key    VARCHAR(255) NOT NULL,
    tenant_id    VARCHAR(100),
    metric_key   VARCHAR(80) NOT NULL,
    product_id   VARCHAR(80),
    used_value   NUMERIC(24, 6) NOT NULL,
    limit_value  NUMERIC(24, 6) NOT NULL,
    severity     VARCHAR(20) NOT NULL,
    window_key   VARCHAR(40) NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_usage_alert_event_key_window
    ON usage_alert_event (alert_key, window_key);

CREATE INDEX IF NOT EXISTS idx_usage_alert_event_created
    ON usage_alert_event (created_at DESC);

CREATE TABLE IF NOT EXISTS usage_alert_dismissal (
    id           UUID PRIMARY KEY,
    alert_key    VARCHAR(255) NOT NULL,
    user_id      VARCHAR(120) NOT NULL,
    dismissed_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_usage_alert_dismissal_key_user
    ON usage_alert_dismissal (alert_key, user_id);
