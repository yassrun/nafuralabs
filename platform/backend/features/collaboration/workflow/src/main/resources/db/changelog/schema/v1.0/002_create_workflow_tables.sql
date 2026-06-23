-- Workflow: workflow_templates, workflow_steps, workflow_instances

CREATE TABLE IF NOT EXISTS workflow_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(60) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    description TEXT,
    is_active   BOOLEAN,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_tenant ON workflow_templates(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_templates_tenant_code ON workflow_templates(tenant_id, code);

CREATE TABLE IF NOT EXISTS workflow_steps (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID NOT NULL,
    workflow_template_id  UUID NOT NULL,
    step_number           INT NOT NULL,
    name                  VARCHAR(200) NOT NULL,
    approver_role         VARCHAR(80) NOT NULL,
    "condition"           TEXT,
    timeout_hours         INT,
    escalation_role       VARCHAR(80),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_template ON workflow_steps(workflow_template_id);

CREATE TABLE IF NOT EXISTS workflow_instances (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL,
    instance_number  VARCHAR(60) NOT NULL,
    template_id      UUID NOT NULL,
    entity_type      VARCHAR(80) NOT NULL,
    entity_id        UUID NOT NULL,
    current_step_id  UUID,
    started_at       TIMESTAMPTZ NOT NULL,
    completed_at     TIMESTAMPTZ,
    initiated_by     VARCHAR(120) NOT NULL,
    status           VARCHAR(30) NOT NULL,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_tenant_entity ON workflow_instances(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_template ON workflow_instances(template_id);
