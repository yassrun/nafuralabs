-- Link RH resource (employe) to platform login identity (app_user). Nullable: ouvriers may have no login.
ALTER TABLE employes
    ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS idx_employes_tenant_user_id
    ON employes (tenant_id, user_id)
    WHERE user_id IS NOT NULL;
