CREATE TABLE IF NOT EXISTS accounting_journals (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    code                    VARCHAR(20) NOT NULL,
    name                    VARCHAR(200) NOT NULL,
    journal_type            VARCHAR(30) NOT NULL,
    default_counterpart_code VARCHAR(50),
    is_active               BOOLEAN NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_accounting_journals_code ON accounting_journals(tenant_id, code);
