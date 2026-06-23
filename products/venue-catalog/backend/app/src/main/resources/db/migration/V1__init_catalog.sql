-- wp-01 canonical catalog schema
CREATE TABLE catalog_places (
    id UUID PRIMARY KEY,
    canonical_name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    country_code CHAR(2) NOT NULL,
    city_code VARCHAR(32) NOT NULL,
    primary_category VARCHAR(64) NOT NULL,
    provider_types JSONB,
    address JSONB NOT NULL,
    geo JSONB NOT NULL,
    contact JSONB,
    opening_hours JSONB,
    provider_rating JSONB,
    attributes JSONB,
    quality JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_catalog_places_city ON catalog_places (city_code);
CREATE INDEX idx_catalog_places_status ON catalog_places (status);
CREATE INDEX idx_catalog_places_category ON catalog_places (primary_category);
CREATE INDEX idx_catalog_places_name ON catalog_places (canonical_name);

CREATE TABLE catalog_place_media (
    id UUID PRIMARY KEY,
    catalog_place_id UUID NOT NULL REFERENCES catalog_places(id) ON DELETE CASCADE,
    source VARCHAR(32) NOT NULL,
    storage_key VARCHAR(512) NOT NULL,
    public_url TEXT,
    width INT,
    height INT,
    attribution_text VARCHAR(255) NOT NULL,
    author_name VARCHAR(255),
    reusable BOOLEAN NOT NULL DEFAULT FALSE,
    provider_photo_ref VARCHAR(255),
    content_checksum VARCHAR(128),
    expires_at TIMESTAMPTZ NOT NULL,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_catalog_place_media_place ON catalog_place_media (catalog_place_id);

CREATE TABLE catalog_place_source_records (
    id UUID PRIMARY KEY,
    catalog_place_id UUID NOT NULL REFERENCES catalog_places(id) ON DELETE CASCADE,
    provider VARCHAR(32) NOT NULL,
    external_id VARCHAR(128) NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL,
    freshness_until TIMESTAMPTZ NOT NULL,
    raw_checksum VARCHAR(128) NOT NULL,
    UNIQUE (provider, external_id)
);

CREATE INDEX idx_catalog_place_source_place ON catalog_place_source_records (catalog_place_id);

CREATE TABLE catalog_jobs (
    id UUID PRIMARY KEY,
    type VARCHAR(64) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    request JSONB NOT NULL,
    result JSONB,
    progress JSONB,
    error JSONB,
    requested_by VARCHAR(128) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_catalog_jobs_status ON catalog_jobs (status);
CREATE INDEX idx_catalog_jobs_type ON catalog_jobs (type);

CREATE TABLE provider_raw_payloads (
    id UUID PRIMARY KEY,
    provider VARCHAR(32) NOT NULL,
    external_id VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_provider_raw_payloads_fetched ON provider_raw_payloads (fetched_at);
