-- Workflow: approval requests and steps

CREATE TABLE IF NOT EXISTS approval_requests (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL,
    entity_type       VARCHAR(80) NOT NULL,
    entity_id         UUID NOT NULL,
    title             VARCHAR(180) NOT NULL,
    status            VARCHAR(30) NOT NULL,
    current_step      VARCHAR(80),
    requested_by      VARCHAR(120) NOT NULL,
    requested_at      TIMESTAMPTZ NOT NULL,
    approved_by       VARCHAR(120),
    approved_at       TIMESTAMPTZ,
    decision_comment  TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approval_requests_tenant_entity ON approval_requests(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(tenant_id, status);

CREATE TABLE IF NOT EXISTS approval_steps (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID NOT NULL,
    approval_request_id  UUID NOT NULL,
    step_number          INT NOT NULL,
    approver_role        VARCHAR(80) NOT NULL,
    approver_id          UUID,
    status               VARCHAR(30) NOT NULL,
    decided_at           TIMESTAMPTZ,
    comment              TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_approval_steps_request ON approval_steps(approval_request_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_tenant ON approval_steps(tenant_id);
