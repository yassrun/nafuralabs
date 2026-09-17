-- Platform audit user columns for code_list (TenantEntity)

ALTER TABLE code_list ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE code_list ADD COLUMN IF NOT EXISTS updated_by UUID;
