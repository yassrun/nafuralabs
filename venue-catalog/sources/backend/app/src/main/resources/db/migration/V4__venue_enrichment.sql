-- Enrichment persistence + AI usage audit for Venue Catalog

CREATE TABLE IF NOT EXISTS catalog_place_geo_resolutions (
    id UUID PRIMARY KEY,
    catalog_place_id UUID NOT NULL REFERENCES catalog_places(id) ON DELETE CASCADE,
    district_code VARCHAR(64),
    district_label VARCHAR(128),
    method VARCHAR(32) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    geo_reference_version VARCHAR(64),
    geo_hash VARCHAR(64) NOT NULL,
    needs_review BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_place_geo_resolutions_place
    ON catalog_place_geo_resolutions(catalog_place_id);
CREATE INDEX IF NOT EXISTS idx_catalog_place_geo_resolutions_district
    ON catalog_place_geo_resolutions(district_code);
CREATE INDEX IF NOT EXISTS idx_catalog_place_geo_resolutions_version
    ON catalog_place_geo_resolutions(geo_reference_version);

CREATE TABLE IF NOT EXISTS catalog_place_ai_enrichments (
    id UUID PRIMARY KEY,
    catalog_place_id UUID NOT NULL REFERENCES catalog_places(id) ON DELETE CASCADE,
    taxonomy_version VARCHAR(64) NOT NULL,
    prompt_version VARCHAR(64) NOT NULL,
    model VARCHAR(128),
    input_hash VARCHAR(64) NOT NULL,
    venue_type VARCHAR(64),
    activities JSONB,
    experience_tags JSONB,
    music_styles JSONB,
    cuisines JSONB,
    audience_tags JSONB,
    category_fit_score DOUBLE PRECISION,
    confidence DOUBLE PRECISION,
    evidence_fields JSONB,
    warnings JSONB,
    selection_suggestion VARCHAR(64),
    structured_output JSONB,
    filter_decision VARCHAR(32),
    verdict VARCHAR(32),
    usage_request_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_catalog_place_ai_enrichments_place
    ON catalog_place_ai_enrichments(catalog_place_id);
CREATE INDEX IF NOT EXISTS idx_catalog_place_ai_enrichments_type
    ON catalog_place_ai_enrichments(venue_type);
CREATE INDEX IF NOT EXISTS idx_catalog_place_ai_enrichments_verdict
    ON catalog_place_ai_enrichments(verdict);
CREATE INDEX IF NOT EXISTS idx_catalog_place_ai_enrichments_hash
    ON catalog_place_ai_enrichments(input_hash, taxonomy_version, prompt_version);

CREATE TABLE IF NOT EXISTS catalog_place_app_scores (
    id UUID PRIMARY KEY,
    catalog_place_id UUID NOT NULL REFERENCES catalog_places(id) ON DELETE CASCADE,
    app_id VARCHAR(32) NOT NULL,
    score DOUBLE PRECISION NOT NULL,
    decision VARCHAR(32) NOT NULL,
    reasons JSONB,
    score_breakdown JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_catalog_place_app_scores UNIQUE (catalog_place_id, app_id)
);

CREATE INDEX IF NOT EXISTS idx_catalog_place_app_scores_decision
    ON catalog_place_app_scores(app_id, decision);
CREATE INDEX IF NOT EXISTS idx_catalog_place_app_scores_score
    ON catalog_place_app_scores(app_id, score);

CREATE TABLE IF NOT EXISTS catalog_job_steps (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES catalog_jobs(id) ON DELETE CASCADE,
    catalog_place_id UUID REFERENCES catalog_places(id) ON DELETE SET NULL,
    step_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    progress_current INT,
    progress_total INT,
    skipped BOOLEAN NOT NULL DEFAULT FALSE,
    skip_reason VARCHAR(255),
    error_code VARCHAR(64),
    error_message TEXT,
    retryable BOOLEAN,
    details JSONB,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalog_job_steps_job ON catalog_job_steps(job_id);
CREATE INDEX IF NOT EXISTS idx_catalog_job_steps_place ON catalog_job_steps(catalog_place_id);
CREATE INDEX IF NOT EXISTS idx_catalog_job_steps_status ON catalog_job_steps(job_id, step_type, status);

-- Platform LLM audit table (Flyway copy — dependency alone does not create it)
CREATE TABLE IF NOT EXISTS ai_usage_event (
    id BIGSERIAL PRIMARY KEY,
    request_id VARCHAR(255) NOT NULL UNIQUE,
    tenant_id VARCHAR(255),
    idempotency_key VARCHAR(255),
    scope_key VARCHAR(300) NOT NULL,
    scope_type VARCHAR(20) NOT NULL DEFAULT 'TENANT',
    application_id VARCHAR(120),
    domain_key VARCHAR(120),
    feature_key VARCHAR(120),
    resource_key VARCHAR(120),
    action_key VARCHAR(120),
    mode VARCHAR(20) NOT NULL DEFAULT 'ASK',
    conversation_id VARCHAR(255),
    message_id VARCHAR(255),
    actor_sub VARCHAR(255),
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    tokens_in BIGINT,
    tokens_out BIGINT,
    tokens_total BIGINT,
    cost_usd DECIMAL(12, 6),
    status VARCHAR(20) NOT NULL,
    error VARCHAR(2000),
    response_content TEXT,
    latency_ms BIGINT,
    estimated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_event_tenant_id ON ai_usage_event(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_event_created_at ON ai_usage_event(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_event_application ON ai_usage_event(application_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_event_domain_feature ON ai_usage_event(domain_key, feature_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_event_scope_idempotency
ON ai_usage_event(scope_key, idempotency_key)
WHERE idempotency_key IS NOT NULL;
