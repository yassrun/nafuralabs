--liquibase formatted sql
--changeset build-intelligence:001_create_extraction_tables
CREATE TABLE IF NOT EXISTS bi_analysis_job (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    document_id UUID NOT NULL,
    status VARCHAR(32) NOT NULL,
    route VARCHAR(32) NOT NULL,
    model_name VARCHAR(128),
    prompt_version VARCHAR(64),
    progress JSONB,
    error_message TEXT,
    idempotency_key VARCHAR(128),
    requested_by VARCHAR(128) NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bi_analysis_job_idempotency UNIQUE (idempotency_key)
);

CREATE TABLE IF NOT EXISTS bi_extraction_run (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    document_id UUID NOT NULL,
    analysis_job_id UUID NOT NULL,
    extractor_version VARCHAR(64) NOT NULL,
    model_name VARCHAR(128),
    schema_version VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    confidence NUMERIC(5, 4),
    raw_output JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bi_extracted_fact (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    extraction_run_id UUID NOT NULL,
    fact_type VARCHAR(64) NOT NULL,
    payload JSONB NOT NULL,
    evidence JSONB NOT NULL,
    confidence NUMERIC(5, 4),
    validation_status VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bi_review_item (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    extracted_fact_id UUID NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_REVIEW',
    reviewer_sub VARCHAR(128),
    correction JSONB,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bi_analysis_job_tenant_status ON bi_analysis_job (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_bi_review_item_tenant_status ON bi_review_item (tenant_id, status);
