--liquibase formatted sql
--changeset build-intelligence:001_create_retrieval_tables
CREATE TABLE IF NOT EXISTS bi_document_chunk (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    document_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    content_tsv TSVECTOR,
    embedding_json JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bi_document_chunk_tsv ON bi_document_chunk USING GIN (content_tsv);
CREATE INDEX IF NOT EXISTS idx_bi_document_chunk_tenant_doc ON bi_document_chunk (tenant_id, document_id);
