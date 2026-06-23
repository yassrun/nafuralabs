CREATE TABLE IF NOT EXISTS lettrages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    code            VARCHAR(10) NOT NULL,
    account_radical VARCHAR(10) NOT NULL,
    status          VARCHAR(20) NOT NULL,
    total_debit     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_credit    NUMERIC(18, 4) NOT NULL DEFAULT 0,
    difference      NUMERIC(18, 4) NOT NULL DEFAULT 0,
    allow_partial   BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lettrages_code ON lettrages(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_lettrages_tenant_account ON lettrages(tenant_id, account_radical);

CREATE TABLE IF NOT EXISTS lettrage_lines (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    lettrage_id             UUID NOT NULL,
    journal_entry_id        UUID NOT NULL,
    journal_entry_line_id   UUID NOT NULL,
    debit                   NUMERIC(18, 4) NOT NULL DEFAULT 0,
    credit                  NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lettrage_lines_entry_line
    ON lettrage_lines(tenant_id, journal_entry_id, journal_entry_line_id);
CREATE INDEX IF NOT EXISTS idx_lettrage_lines_lettrage ON lettrage_lines(tenant_id, lettrage_id);
