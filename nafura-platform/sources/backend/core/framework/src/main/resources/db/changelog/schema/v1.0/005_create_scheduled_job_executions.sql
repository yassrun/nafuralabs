CREATE TABLE IF NOT EXISTS scheduled_job_executions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID,
    job_key         VARCHAR(100) NOT NULL,
    started_at      TIMESTAMPTZ NOT NULL,
    ended_at        TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
    error_message   TEXT,
    duration_ms     BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_exec_key_started ON scheduled_job_executions(job_key, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_exec_tenant      ON scheduled_job_executions(tenant_id, started_at DESC);

