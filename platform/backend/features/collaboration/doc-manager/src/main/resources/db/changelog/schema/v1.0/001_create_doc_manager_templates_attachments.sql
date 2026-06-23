-- Doc-manager: document, document_templates, record_attachments

CREATE TABLE IF NOT EXISTS document (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID,
    file_name           VARCHAR(255),
    mime_type           VARCHAR(120),
    storage_key         TEXT,
    checksum_sha256     VARCHAR(64),
    file_size_bytes     BIGINT,
    doc_type            VARCHAR(80),
    status              VARCHAR(30),
    occurred_at         TIMESTAMPTZ,
    uploaded_by_user_id UUID,
    meta                JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_tenant_id ON document(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_doc_type ON document(doc_type);
CREATE INDEX IF NOT EXISTS idx_document_status ON document(status);

CREATE TABLE IF NOT EXISTS document_templates (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    code          VARCHAR(60) NOT NULL,
    name          VARCHAR(200) NOT NULL,
    entity_type   VARCHAR(80) NOT NULL,
    format        VARCHAR(20) NOT NULL,
    template_body TEXT,
    is_default    BOOLEAN,
    is_active     BOOLEAN,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_templates_tenant ON document_templates(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_document_templates_tenant_code ON document_templates(tenant_id, code);

CREATE TABLE IF NOT EXISTS record_attachments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    entity_type  VARCHAR(80) NOT NULL,
    entity_id    UUID NOT NULL,
    file_name    VARCHAR(255) NOT NULL,
    file_url     VARCHAR(1000) NOT NULL,
    mime_type    VARCHAR(120),
    size_bytes   BIGINT,
    uploaded_by  VARCHAR(120),
    uploaded_at  TIMESTAMPTZ,
    is_primary   BOOLEAN,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_record_attachments_tenant_entity ON record_attachments(tenant_id, entity_type, entity_id);
