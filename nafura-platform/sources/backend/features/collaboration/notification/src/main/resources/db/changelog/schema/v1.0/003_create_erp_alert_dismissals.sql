-- ERP operational alert dismissals (per user, until underlying issue resolves)

CREATE TABLE IF NOT EXISTS erp_alert_dismissals (
    tenant_id   UUID NOT NULL,
    user_id     UUID NOT NULL,
    alert_key   VARCHAR(200) NOT NULL,
    dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, user_id, alert_key)
);
CREATE INDEX IF NOT EXISTS idx_erp_alert_dismissals_user ON erp_alert_dismissals(tenant_id, user_id);
