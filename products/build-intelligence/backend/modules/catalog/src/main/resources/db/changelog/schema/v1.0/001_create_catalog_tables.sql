--liquibase formatted sql
--changeset build-intelligence:001_create_catalog_tables
CREATE TABLE IF NOT EXISTS bi_category (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    parent_id UUID,
    code VARCHAR(64),
    label_fr VARCHAR(255) NOT NULL,
    category_type VARCHAR(64) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bi_work_item (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    category_id UUID,
    code VARCHAR(64),
    designation TEXT NOT NULL,
    normalized_designation TEXT NOT NULL,
    technical_description TEXT,
    unit_code VARCHAR(32) NOT NULL,
    attributes JSONB,
    validation_status VARCHAR(32) NOT NULL DEFAULT 'VALIDATED',
    source_document_id UUID,
    embedding_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bi_price_observation (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    work_item_id UUID,
    document_id UUID,
    price_type VARCHAR(64) NOT NULL,
    amount NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(8) NOT NULL DEFAULT 'MAD',
    unit_code VARCHAR(32),
    quantity NUMERIC(18, 4),
    city VARCHAR(128),
    region VARCHAR(128),
    project_type VARCHAR(128),
    observed_at DATE,
    confidence NUMERIC(5, 4),
    validation_status VARCHAR(32) NOT NULL DEFAULT 'VALIDATED',
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bi_cps_clause (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    category_id UUID,
    code VARCHAR(64),
    title TEXT NOT NULL,
    clause_type VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    attributes JSONB,
    validation_status VARCHAR(32) NOT NULL DEFAULT 'VALIDATED',
    source_document_id UUID,
    embedding_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bi_work_item_tenant_designation ON bi_work_item (tenant_id, normalized_designation);
CREATE INDEX IF NOT EXISTS idx_bi_price_observation_work_item ON bi_price_observation (tenant_id, work_item_id);
