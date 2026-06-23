CREATE TABLE IF NOT EXISTS bank_accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    code                VARCHAR(30) NOT NULL,
    name                VARCHAR(255) NOT NULL,
    account_type        VARCHAR(20) NOT NULL DEFAULT 'BANQUE',
    bank_name           VARCHAR(100),
    rib                 VARCHAR(50),
    branch              VARCHAR(100),
    currency_code       VARCHAR(3) NOT NULL DEFAULT 'MAD',
    gl_account_code     VARCHAR(50),
    opening_balance     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bank_accounts_code ON bank_accounts(tenant_id, code);

CREATE TABLE IF NOT EXISTS bank_statements (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    bank_account_id             UUID NOT NULL,
    statement_number            VARCHAR(50) NOT NULL,
    period_start                DATE NOT NULL,
    period_end                  DATE NOT NULL,
    opening_balance_accounting  NUMERIC(18, 4) NOT NULL DEFAULT 0,
    closing_balance_accounting  NUMERIC(18, 4) NOT NULL DEFAULT 0,
    closing_balance_statement   NUMERIC(18, 4) NOT NULL DEFAULT 0,
    variance                    NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status                      VARCHAR(20) NOT NULL DEFAULT 'EN_COURS',
    imported_file_name          VARCHAR(255),
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_bank_statements_number ON bank_statements(tenant_id, statement_number);
CREATE INDEX IF NOT EXISTS idx_bank_statements_account ON bank_statements(tenant_id, bank_account_id);

CREATE TABLE IF NOT EXISTS bank_statement_lines (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    bank_statement_id           UUID NOT NULL,
    line_date                   DATE NOT NULL,
    label                       VARCHAR(500) NOT NULL,
    reference                   VARCHAR(100),
    receipt_amount              NUMERIC(18, 4) NOT NULL DEFAULT 0,
    payment_amount              NUMERIC(18, 4) NOT NULL DEFAULT 0,
    matched_journal_entry_id    UUID,
    matched_journal_entry_line_id UUID,
    matched_mouvement_ref       VARCHAR(100),
    match_status                VARCHAR(20) NOT NULL DEFAULT 'UNMATCHED',
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bank_statement_lines_statement ON bank_statement_lines(tenant_id, bank_statement_id);
