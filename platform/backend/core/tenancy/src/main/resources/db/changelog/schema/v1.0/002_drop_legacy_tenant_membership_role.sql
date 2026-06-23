-- Tenancy module: remove legacy role from tenant_membership.
-- Roles are now managed by authorization.tenant_user_role.

DROP INDEX IF EXISTS idx_tenant_membership_role;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenant_membership'
          AND column_name = 'role'
    ) THEN
        ALTER TABLE tenant_membership DROP COLUMN role;
    END IF;
END $$;
