-- Mark in-app rows included in an e-mail digest so the same lot is not resent.

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS digested_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_notifications_digest
    ON notifications (tenant_id, recipient_id, digested_at)
    WHERE channel = 'in_app' AND digested_at IS NULL;
