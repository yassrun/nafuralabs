-- One preference per (organisation or user) × declared event × channel. user_id NULL: the organisation's choice.
-- Replaces the per-user boolean columns, which nothing wrote.

DROP TABLE IF EXISTS notification_preferences;

CREATE TABLE notification_preferences (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  UUID NOT NULL,
    user_id    UUID,
    event      VARCHAR(120) NOT NULL,
    channel    VARCHAR(20) NOT NULL,
    enabled    BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_preferences_tenant ON notification_preferences(tenant_id);
CREATE UNIQUE INDEX uq_notification_preferences_org ON notification_preferences(tenant_id, event, channel) WHERE user_id IS NULL;
CREATE UNIQUE INDEX uq_notification_preferences_user ON notification_preferences(tenant_id, user_id, event, channel) WHERE user_id IS NOT NULL;

-- source holds the declared event id (e.g. demo.purchasing.request.approved).
ALTER TABLE notifications ALTER COLUMN source TYPE VARCHAR(120);
