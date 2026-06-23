CREATE TABLE IF NOT EXISTS reglements (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    numero                  VARCHAR(50) NOT NULL,
    reglement_type          VARCHAR(30) NOT NULL,
    reglement_date          DATE NOT NULL,
    payment_mode_code       VARCHAR(30) NOT NULL,
    reference               VARCHAR(100),
    issuing_bank            VARCHAR(200),
    partner_id              VARCHAR(100) NOT NULL,
    partner_name            VARCHAR(255),
    financial_account_id    VARCHAR(50) NOT NULL,
    financial_account_label VARCHAR(255),
    total_amount            NUMERIC(18, 4) NOT NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    journal_entry_id        UUID,
    notes                   TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_reglements_numero ON reglements(tenant_id, numero);
CREATE INDEX IF NOT EXISTS idx_reglements_tenant_type ON reglements(tenant_id, reglement_type, reglement_date);
CREATE INDEX IF NOT EXISTS idx_reglements_partner ON reglements(tenant_id, partner_id);

CREATE TABLE IF NOT EXISTS reglement_imputations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    reglement_id        UUID NOT NULL,
    facture_id          VARCHAR(100) NOT NULL,
    facture_numero      VARCHAR(100),
    facture_date        DATE,
    facture_due_date    DATE,
    facture_remaining   NUMERIC(18, 4),
    allocated_amount    NUMERIC(18, 4) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reglement_imputations_reglement ON reglement_imputations(tenant_id, reglement_id);
