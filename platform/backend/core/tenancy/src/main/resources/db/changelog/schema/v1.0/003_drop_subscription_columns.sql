-- Remove legacy subscription/plan columns from tenancy.

ALTER TABLE IF EXISTS tenant
    DROP COLUMN IF EXISTS subscription_status,
    DROP COLUMN IF EXISTS subscription_plan,
    DROP COLUMN IF EXISTS subscription_limits;

ALTER TABLE IF EXISTS tenant_domain
    DROP COLUMN IF EXISTS plan_code,
    DROP COLUMN IF EXISTS limits_json;
