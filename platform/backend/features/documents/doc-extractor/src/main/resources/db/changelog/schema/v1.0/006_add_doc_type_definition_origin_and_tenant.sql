-- Liquibase: doc-extractor schema v1.0 (006). Formerly Flyway V4_0_2.
-- Doc-extractor module: Add origin and tenant_id columns to doc_type_definition
-- Origin distinguishes between SYSTEM (Doxura-provided) and TENANT (user-created) doc types

-- Add origin column (SYSTEM or TENANT)
ALTER TABLE doc_type_definition
  ADD COLUMN IF NOT EXISTS origin VARCHAR(20) NOT NULL DEFAULT 'SYSTEM';

-- Add tenant_id column (NULL for SYSTEM types, populated for TENANT types)
ALTER TABLE doc_type_definition
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Create index for efficient tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_doc_type_def_origin ON doc_type_definition(origin);
CREATE INDEX IF NOT EXISTS idx_doc_type_def_tenant_id ON doc_type_definition(tenant_id);

-- Add comment for documentation
COMMENT ON COLUMN doc_type_definition.origin IS 'SYSTEM = Doxura-provided (read-only), TENANT = user-created (editable)';
COMMENT ON COLUMN doc_type_definition.tenant_id IS 'NULL for SYSTEM types (visible to all), UUID for TENANT types (scoped to tenant)';
