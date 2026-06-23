CREATE TABLE IF NOT EXISTS caisses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    caisse_type         VARCHAR(20) NOT NULL,
    code                VARCHAR(30),
    name                VARCHAR(255) NOT NULL,
    chantier_id         VARCHAR(100),
    chantier_label      VARCHAR(255),
    chef_chantier_id    VARCHAR(100),
    chef_chantier_name  VARCHAR(255),
    currency_code       VARCHAR(3) NOT NULL DEFAULT 'MAD',
    gl_account_code     VARCHAR(50),
    opening_balance     NUMERIC(18, 4) NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'OUVERTE',
    opened_at           DATE,
    closed_at           DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_caisses_tenant_type ON caisses(tenant_id, caisse_type);
CREATE INDEX IF NOT EXISTS idx_caisses_chantier ON caisses(tenant_id, chantier_id);

CREATE TABLE IF NOT EXISTS caisse_mouvements (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    caisse_id           UUID NOT NULL,
    movement_date       DATE NOT NULL,
    movement_type       VARCHAR(30) NOT NULL,
    amount              NUMERIC(18, 4) NOT NULL,
    category            VARCHAR(100),
    description         VARCHAR(500) NOT NULL,
    photo_ticket_url    VARCHAR(500),
    geoloc_lat          NUMERIC(10, 7),
    geoloc_lng          NUMERIC(10, 7),
    validated_by        VARCHAR(255),
    workflow_status     VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_caisse_mouvements_caisse ON caisse_mouvements(tenant_id, caisse_id);
