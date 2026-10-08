-- email_templates as a record (audit users); tenant_id stays nullable for system rows.

ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS updated_by UUID;
