-- api_keys becomes a record (TenantEntity): who changed it last.

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS updated_by UUID;
