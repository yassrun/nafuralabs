-- workflow_templates becomes a record (TenantEntity): who created and changed it.

ALTER TABLE workflow_templates ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE workflow_templates ADD COLUMN IF NOT EXISTS updated_by UUID;
