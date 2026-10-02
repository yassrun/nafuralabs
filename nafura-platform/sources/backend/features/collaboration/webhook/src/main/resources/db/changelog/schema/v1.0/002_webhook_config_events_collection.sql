-- WebhookConfig.events is an @ElementCollection (webhook_config_events), not the webhook_configs.events array
-- the entity never writes. Existing arrays are copied; the old column stays (nullable) for rollback.

CREATE TABLE IF NOT EXISTS webhook_config_events (
    webhook_id  UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
    event       VARCHAR(100) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_webhook_config_events_webhook ON webhook_config_events(webhook_id);

INSERT INTO webhook_config_events (webhook_id, event)
SELECT c.id, e.event
FROM webhook_configs c
CROSS JOIN LATERAL unnest(c.events) AS e(event)
WHERE c.events IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM webhook_config_events x WHERE x.webhook_id = c.id);

ALTER TABLE webhook_configs ALTER COLUMN events DROP NOT NULL;
