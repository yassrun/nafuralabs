-- Liquibase: doc-extractor schema v1.0 (002). Formerly Flyway V3_0_1.
-- =============================================================================
-- Doc-extractor module: Create extracted_record table
-- =============================================================================
CREATE TABLE IF NOT EXISTS extracted_record (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    record_id VARCHAR(255) NOT NULL,
    domain_key VARCHAR(80) NOT NULL,
    doc_type_key VARCHAR(80) NOT NULL,
    doc_type_version INT NOT NULL,
    doc_type_definition_id UUID,
    stored_document_id UUID,
    data_json JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'validated',
    workflow_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    validation_state VARCHAR(20),
    completeness_state VARCHAR(20),
    error_count INT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Unique constraint for record_id (globally unique)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_extracted_record_id'
    ) THEN
        ALTER TABLE extracted_record
            ADD CONSTRAINT unique_extracted_record_id UNIQUE (record_id);
    END IF;
END $$;

-- Foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_extracted_record_definition'
    ) THEN
        ALTER TABLE extracted_record
            ADD CONSTRAINT fk_extracted_record_definition
            FOREIGN KEY (doc_type_definition_id)
            REFERENCES doc_type_definition(id);
    END IF;
END $$;

-- Indexes for extracted_record
CREATE INDEX IF NOT EXISTS idx_extracted_record_tenant ON extracted_record(tenant_id);
CREATE INDEX IF NOT EXISTS idx_extracted_record_session ON extracted_record(domain_key, doc_type_key, doc_type_version);
CREATE INDEX IF NOT EXISTS idx_extracted_record_tenant_session ON extracted_record(tenant_id, domain_key, doc_type_key, doc_type_version);
CREATE INDEX IF NOT EXISTS idx_extracted_record_record_id ON extracted_record(record_id);
CREATE INDEX IF NOT EXISTS idx_extracted_record_stored_document_id ON extracted_record(stored_document_id);
CREATE INDEX IF NOT EXISTS idx_extracted_record_definition ON extracted_record(doc_type_definition_id);
CREATE INDEX IF NOT EXISTS idx_extracted_record_workflow_status ON extracted_record(workflow_status);
CREATE INDEX IF NOT EXISTS idx_extracted_record_validation_state 
ON extracted_record(validation_state) 
WHERE validation_state IS NOT NULL;

-- Comments
COMMENT ON COLUMN extracted_record.doc_type_definition_id IS 'Reference to the exact DocTypeDefinition version used for this record';
