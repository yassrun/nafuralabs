-- Email templates for system and custom emails (Thymeleaf variable substitution)

CREATE TABLE IF NOT EXISTS email_templates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID,
    code        VARCHAR(80) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    subject     VARCHAR(500) NOT NULL,
    html_body   TEXT,
    text_body   TEXT,
    entity_type VARCHAR(80),
    is_system   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_email_templates_tenant_code ON email_templates(COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), code);
CREATE INDEX IF NOT EXISTS idx_email_templates_system ON email_templates(is_system, code);
