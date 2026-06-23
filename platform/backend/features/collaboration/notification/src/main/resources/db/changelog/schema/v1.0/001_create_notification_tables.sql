-- Notification feature: alert_rules, notifications, notification_preferences, escalations, broadcasts

CREATE TABLE IF NOT EXISTS alert_rules (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL,
    code              VARCHAR(60) NOT NULL,
    name              VARCHAR(200) NOT NULL,
    entity_type       VARCHAR(80) NOT NULL,
    "condition"       TEXT NOT NULL,
    severity          VARCHAR(30) NOT NULL,
    recipients        TEXT NOT NULL,
    channel           VARCHAR(30) NOT NULL,
    cooldown_minutes  INT,
    status            VARCHAR(30) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_alert_rules_tenant ON alert_rules(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_alert_rules_tenant_code ON alert_rules(tenant_id, code);

CREATE TABLE IF NOT EXISTS notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    recipient_id UUID NOT NULL,
    title        VARCHAR(200) NOT NULL,
    body         TEXT,
    channel      VARCHAR(30) NOT NULL,
    entity_type VARCHAR(80),
    entity_id   UUID,
    is_read     BOOLEAN,
    read_at     TIMESTAMPTZ,
    sent_at     TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_recipient ON notifications(tenant_id, recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications(sent_at);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    user_id        UUID NOT NULL,
    event_type     VARCHAR(80) NOT NULL,
    email_enabled  BOOLEAN,
    in_app_enabled BOOLEAN,
    push_enabled   BOOLEAN,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_tenant_user ON notification_preferences(tenant_id, user_id);

CREATE TABLE IF NOT EXISTS escalations (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID NOT NULL,
    escalation_number   VARCHAR(60) NOT NULL,
    workflow_instance_id UUID NOT NULL,
    task_id              UUID NOT NULL,
    original_assignee    VARCHAR(120) NOT NULL,
    escalated_to         VARCHAR(120) NOT NULL,
    escalation_date      TIMESTAMPTZ NOT NULL,
    reason               TEXT NOT NULL,
    resolved_date        TIMESTAMPTZ,
    status               VARCHAR(30) NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_escalations_tenant ON escalations(tenant_id);

CREATE TABLE IF NOT EXISTS broadcasts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL,
    broadcast_number VARCHAR(60) NOT NULL,
    title            VARCHAR(200) NOT NULL,
    message          TEXT NOT NULL,
    audience         VARCHAR(60) NOT NULL,
    channel          VARCHAR(30) NOT NULL,
    urgency          VARCHAR(30) NOT NULL,
    sent_at          TIMESTAMPTZ,
    sent_by          VARCHAR(120) NOT NULL,
    recipient_count  INT,
    status           VARCHAR(30) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_broadcasts_tenant ON broadcasts(tenant_id);
