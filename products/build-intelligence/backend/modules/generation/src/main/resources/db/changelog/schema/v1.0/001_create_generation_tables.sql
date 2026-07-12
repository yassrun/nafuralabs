--liquibase formatted sql
--changeset build-intelligence:001_create_generation_tables
CREATE TABLE IF NOT EXISTS bi_generation_job (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    job_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    request JSONB NOT NULL,
    result JSONB,
    output_object_key TEXT,
    requested_by VARCHAR(128) NOT NULL,
    approved_by VARCHAR(128),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bi_generation_job_tenant_status ON bi_generation_job (tenant_id, status);
