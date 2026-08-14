CREATE TABLE IF NOT EXISTS trade_effects (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    effect_number       VARCHAR(50) NOT NULL,
    effect_type         VARCHAR(10) NOT NULL,
    invoice_id          VARCHAR(100) NOT NULL,
    client_id           VARCHAR(100) NOT NULL,
    client_name         VARCHAR(255),
    domicile_bank       VARCHAR(50) NOT NULL,
    drawn_bank_id       VARCHAR(100),
    amount              NUMERIC(18, 4) NOT NULL,
    due_date            DATE NOT NULL,
    remittance_date     DATE,
    discount_date       DATE,
    status              VARCHAR(30) NOT NULL DEFAULT 'PORTEFEUILLE',
    discount_fee        NUMERIC(18, 4),
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_trade_effects_number ON trade_effects(tenant_id, effect_number);
CREATE INDEX IF NOT EXISTS idx_trade_effects_status ON trade_effects(tenant_id, status);

CREATE TABLE IF NOT EXISTS virements (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    virement_number         VARCHAR(50) NOT NULL,
    virement_type           VARCHAR(20) NOT NULL,
    virement_date           DATE NOT NULL,
    status                  VARCHAR(20) NOT NULL,
    amount                  NUMERIC(18, 4) NOT NULL DEFAULT 0,
    motif                   VARCHAR(500),
    reference               VARCHAR(100),
    source_account_id       UUID,
    source_account_label    VARCHAR(255),
    dest_account_id         UUID,
    dest_account_label      VARCHAR(255),
    bank_code               VARCHAR(20),
    execution_date          DATE,
    generated_xml           TEXT,
    journal_entry_id        UUID,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_virements_number ON virements(tenant_id, virement_number);
CREATE INDEX IF NOT EXISTS idx_virements_type_status ON virements(tenant_id, virement_type, status);

CREATE TABLE IF NOT EXISTS virement_lines (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    virement_id         UUID NOT NULL,
    line_number         INT NOT NULL,
    beneficiary_name    VARCHAR(255) NOT NULL,
    beneficiary_rib     VARCHAR(50) NOT NULL,
    amount              NUMERIC(18, 4) NOT NULL,
    motif               VARCHAR(500) NOT NULL,
    reference_piece     VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_virement_lines_virement ON virement_lines(tenant_id, virement_id);
