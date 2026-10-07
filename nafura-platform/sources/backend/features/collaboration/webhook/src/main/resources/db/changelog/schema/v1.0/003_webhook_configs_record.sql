-- webhook_configs becomes a record (TenantEntity): who created and changed it.

ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS updated_by UUID;
