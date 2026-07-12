--liquibase formatted sql
--changeset build-intelligence:001_create_knowledge_documents
CREATE TABLE IF NOT EXISTS bi_knowledge_document (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    stored_document_id UUID,
    object_key TEXT NOT NULL,
    filename TEXT,
    mime_type VARCHAR(128),
    sha256 VARCHAR(64) NOT NULL,
    size_bytes BIGINT,
    document_type VARCHAR(64) NOT NULL,
    visibility VARCHAR(32) NOT NULL DEFAULT 'PRIVATE',
    city VARCHAR(128),
    region VARCHAR(128),
    project_type VARCHAR(128),
    publication_date DATE,
    processing_status VARCHAR(32) NOT NULL DEFAULT 'DOWNLOADED',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bi_knowledge_document_tenant_hash UNIQUE (tenant_id, sha256)
);

CREATE INDEX IF NOT EXISTS idx_bi_knowledge_document_tenant_status
    ON bi_knowledge_document (tenant_id, processing_status);
