-- Jobs d'extraction asynchrones (bordereau LLM + indexation CPS).
--
-- Le dépôt reste synchrone ; le traitement long vit ici, avec claim Postgres
-- (FOR UPDATE SKIP LOCKED) et lease pour reprise après crash.

CREATE TABLE IF NOT EXISTS document_extraction_jobs (
    id                    UUID PRIMARY KEY,
    tenant_id             UUID NOT NULL,
    dossier_etude_id      UUID NOT NULL REFERENCES dossiers_etude(id) ON DELETE CASCADE,
    dossier_document_id   UUID NOT NULL REFERENCES dossier_documents(id) ON DELETE CASCADE,
    job_type              VARCHAR(40) NOT NULL,
    status                VARCHAR(20) NOT NULL,
    progress_percent      INT NOT NULL DEFAULT 0,
    progress_step         VARCHAR(80),
    result_json           JSONB,
    error_code            VARCHAR(80),
    error_message         VARCHAR(1000),
    attempt_count         INT NOT NULL DEFAULT 0,
    max_attempts          INT NOT NULL DEFAULT 3,
    available_at          TIMESTAMPTZ NOT NULL,
    lease_owner           VARCHAR(100),
    lease_expires_at      TIMESTAMPTZ,
    content_hash          VARCHAR(64),
    extractor_version     VARCHAR(40) NOT NULL DEFAULT 'etudes-1.0.0',
    idempotency_key       VARCHAR(200),
    created_at            TIMESTAMPTZ NOT NULL,
    started_at            TIMESTAMPTZ,
    finished_at           TIMESTAMPTZ,
    CONSTRAINT document_extraction_jobs_type_chk CHECK (job_type IN (
        'BORDEREAU_EXTRACT', 'CPS_INDEX')),
    CONSTRAINT document_extraction_jobs_status_chk CHECK (status IN (
        'QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
    CONSTRAINT document_extraction_jobs_progress_chk CHECK (
        progress_percent >= 0 AND progress_percent <= 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS document_extraction_jobs_idempotency_uidx
    ON document_extraction_jobs (tenant_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS document_extraction_jobs_claim_idx
    ON document_extraction_jobs (status, available_at, lease_expires_at);

CREATE INDEX IF NOT EXISTS document_extraction_jobs_dossier_idx
    ON document_extraction_jobs (tenant_id, dossier_etude_id, created_at DESC);

CREATE INDEX IF NOT EXISTS document_extraction_jobs_piece_idx
    ON document_extraction_jobs (tenant_id, dossier_document_id, job_type, created_at DESC);
