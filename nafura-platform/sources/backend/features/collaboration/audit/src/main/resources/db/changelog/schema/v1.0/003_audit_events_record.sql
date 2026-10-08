-- audit_events becomes a read-only record (TenantEntity): optional who created/changed it.

ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE audit_events ADD COLUMN IF NOT EXISTS updated_by UUID;
