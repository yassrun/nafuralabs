-- Liquibase: doc-extractor schema v1.0 (001). Formerly Flyway V3_0_0.
-- =============================================================================
-- Doc-extractor module: Create doc_type_definition table
-- =============================================================================
CREATE TABLE IF NOT EXISTS doc_type_definition (
    id UUID PRIMARY KEY,
    domain_key VARCHAR(80) NOT NULL,
    doc_type_key VARCHAR(80) NOT NULL,
    version INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    json_schema JSONB NOT NULL,
    ui_schema JSONB,
    builder_state JSONB,
    excel_mapping JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(120),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(120)
);

-- Unique constraint for (domain_key, doc_type_key, version)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_doc_type_definition'
    ) THEN
        ALTER TABLE doc_type_definition
            ADD CONSTRAINT unique_doc_type_definition
            UNIQUE (domain_key, doc_type_key, version);
    END IF;
END $$;

-- Indexes for doc_type_definition
CREATE INDEX IF NOT EXISTS idx_doc_type_def_domain_key ON doc_type_definition(domain_key);
CREATE INDEX IF NOT EXISTS idx_doc_type_def_doc_type_key ON doc_type_definition(doc_type_key);
CREATE INDEX IF NOT EXISTS idx_doc_type_def_version ON doc_type_definition(version);
CREATE INDEX IF NOT EXISTS idx_doc_type_def_status ON doc_type_definition(status);
CREATE INDEX IF NOT EXISTS idx_doc_type_def_latest_published 
ON doc_type_definition(domain_key, doc_type_key, version DESC) 
WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_doc_type_def_draft 
ON doc_type_definition(domain_key, doc_type_key) 
WHERE status = 'DRAFT';
CREATE INDEX IF NOT EXISTS idx_doc_type_def_version_list 
ON doc_type_definition(domain_key, doc_type_key, version DESC, status);

-- Comments
COMMENT ON COLUMN doc_type_definition.status IS 'Version status: DRAFT (editable), PUBLISHED (immutable, active), DEPRECATED (immutable, inactive)';
COMMENT ON COLUMN doc_type_definition.builder_state IS 'Canonical builder state JSON for drafts, used to generate jsonSchema and uiSchema';
