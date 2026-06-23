CREATE TABLE IF NOT EXISTS journal_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    entry_number    VARCHAR(50) NOT NULL,
    journal_id      UUID NOT NULL,
    journal_code    VARCHAR(20) NOT NULL,
    entry_date      DATE NOT NULL,
    fiscal_year     INTEGER NOT NULL,
    period          INTEGER NOT NULL,
    reference       VARCHAR(100),
    label           VARCHAR(500) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    origin          VARCHAR(50),
    origin_id       VARCHAR(100),
    total_debit     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_credit    NUMERIC(18, 4) NOT NULL DEFAULT 0,
    validated_at    TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_journal_entries_number ON journal_entries(tenant_id, entry_number);
CREATE INDEX IF NOT EXISTS idx_journal_entries_journal ON journal_entries(tenant_id, journal_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(tenant_id, status);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    journal_entry_id    UUID NOT NULL,
    line_number         INTEGER NOT NULL,
    account_code        VARCHAR(50) NOT NULL,
    account_label       VARCHAR(255),
    debit               NUMERIC(18, 4) NOT NULL DEFAULT 0,
    credit              NUMERIC(18, 4) NOT NULL DEFAULT 0,
    label               VARCHAR(500),
    analytical_axis     VARCHAR(100),
    third_party_name    VARCHAR(255),
    due_date            DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_entry ON journal_entry_lines(tenant_id, journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_account ON journal_entry_lines(tenant_id, account_code);
