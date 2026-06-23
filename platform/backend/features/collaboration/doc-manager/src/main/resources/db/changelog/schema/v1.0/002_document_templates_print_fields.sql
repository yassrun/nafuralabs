-- Liquibase: doc-manager schema v1.0 (002). Formerly Flyway V4_0_1; complements 001_create_doc_manager_templates_attachments.sql.
-- Print template columns on document_templates (entity alignment).
ALTER TABLE document_templates
    ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS paper_size VARCHAR(20),
    ADD COLUMN IF NOT EXISTS orientation VARCHAR(20),
    ADD COLUMN IF NOT EXISTS margins_css VARCHAR(80),
    ADD COLUMN IF NOT EXISTS metadata TEXT;
