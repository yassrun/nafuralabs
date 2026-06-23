CREATE TABLE IF NOT EXISTS delegations_approbation (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    user_id             VARCHAR(100) NOT NULL,
    delegue_user_id     VARCHAR(100) NOT NULL,
    date_debut          DATE NOT NULL,
    date_fin            DATE NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delegations_approbation_tenant_user
    ON delegations_approbation(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_delegations_approbation_tenant_active
    ON delegations_approbation(tenant_id, is_active);
