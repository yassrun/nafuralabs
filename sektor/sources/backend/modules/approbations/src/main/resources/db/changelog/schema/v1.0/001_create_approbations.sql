CREATE TABLE IF NOT EXISTS approval_workflows (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    code                    VARCHAR(50) NOT NULL,
    label                   VARCHAR(255) NOT NULL,
    entity_type             VARCHAR(30) NOT NULL,
    conditions_json         TEXT,
    etapes_json             TEXT,
    sla_jours               INTEGER NOT NULL DEFAULT 4,
    escalade_apres_jours    INTEGER,
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_approval_workflows_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_tenant_entity
    ON approval_workflows(tenant_id, entity_type);

CREATE TABLE IF NOT EXISTS erp_approval_requests (
    id                      VARCHAR(100) PRIMARY KEY,
    tenant_id               UUID NOT NULL,
    workflow_id             VARCHAR(100) NOT NULL REFERENCES approval_workflows(id),
    entity_type             VARCHAR(30) NOT NULL,
    entity_id               VARCHAR(100) NOT NULL,
    entity_ref              VARCHAR(100) NOT NULL,
    entity_summary          TEXT NOT NULL,
    montant_concerne        NUMERIC(18, 4),
    chantier_id             VARCHAR(100),
    initiateur_user_id      VARCHAR(100) NOT NULL,
    initiateur_nom          VARCHAR(255) NOT NULL,
    status                  VARCHAR(30) NOT NULL DEFAULT 'EN_COURS',
    etape_courante_index    INTEGER NOT NULL DEFAULT 0,
    date_soumission         DATE NOT NULL,
    date_cloture            DATE,
    urgence                 VARCHAR(20) NOT NULL DEFAULT 'NORMALE',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_erp_approval_requests_tenant_status
    ON erp_approval_requests(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_erp_approval_requests_tenant_entity
    ON erp_approval_requests(tenant_id, entity_type, entity_id);

CREATE TABLE IF NOT EXISTS approval_events (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    request_id              VARCHAR(100) NOT NULL REFERENCES erp_approval_requests(id) ON DELETE CASCADE,
    action                  VARCHAR(30) NOT NULL,
    user_id                 VARCHAR(100) NOT NULL,
    user_nom                VARCHAR(255),
    commentaire             TEXT,
    payload_json            TEXT,
    previous_hash           VARCHAR(64),
    event_hash              VARCHAR(64) NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_events_tenant_request
    ON approval_events(tenant_id, request_id, created_at);
