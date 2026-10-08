-- document_templates as a record (TenantEntity audit users).

ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS updated_by UUID;
