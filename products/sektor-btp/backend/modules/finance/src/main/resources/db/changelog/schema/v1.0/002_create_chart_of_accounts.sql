CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id                   UUID NOT NULL,
    code                        VARCHAR(50) NOT NULL,
    name                        VARCHAR(255) NOT NULL,
    account_class               INTEGER NOT NULL,
    account_type                VARCHAR(30) NOT NULL,
    parent_account_code         VARCHAR(50),
    is_collectif                BOOLEAN NOT NULL DEFAULT false,
    is_lettrable                BOOLEAN NOT NULL DEFAULT false,
    is_auxiliaire               BOOLEAN NOT NULL DEFAULT false,
    axe_analytique_obligatoire  BOOLEAN NOT NULL DEFAULT false,
    is_active                   BOOLEAN NOT NULL DEFAULT true,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_chart_of_accounts_code ON chart_of_accounts(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_tenant ON chart_of_accounts(tenant_id);
