-- Platform scheduled job definitions (synced from the code registry) for the read-only listing.

CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id                UUID PRIMARY KEY,
    tenant_id         UUID,
    job_key           VARCHAR(100) NOT NULL,
    description       VARCHAR(500) NOT NULL,
    cron              VARCHAR(120) NOT NULL,
    tenant_scoped     BOOLEAN NOT NULL DEFAULT FALSE,
    enabled           BOOLEAN NOT NULL DEFAULT TRUE,
    name_key          VARCHAR(200) NOT NULL,
    last_status       VARCHAR(20),
    last_started_at   TIMESTAMPTZ,
    last_duration_ms  BIGINT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        UUID,
    updated_by        UUID,
    CONSTRAINT uq_scheduled_jobs_key UNIQUE (job_key),
    version      BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_tenant ON scheduled_jobs(tenant_id);
