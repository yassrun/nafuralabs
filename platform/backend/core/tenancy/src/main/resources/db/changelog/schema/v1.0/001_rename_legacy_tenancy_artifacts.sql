-- Tenancy module: hard rename legacy naming to CRUX naming.

DO $$
BEGIN
    -- tenant_module -> tenant_domain
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'tenant_module'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'tenant_domain'
    ) THEN
        ALTER TABLE tenant_module RENAME TO tenant_domain;
    END IF;

    -- module_code -> domain_code
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenant_domain'
          AND column_name = 'module_code'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenant_domain'
          AND column_name = 'domain_code'
    ) THEN
        ALTER TABLE tenant_domain RENAME COLUMN module_code TO domain_code;
    END IF;

    -- product_id -> application_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenant'
          AND column_name = 'product_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenant'
          AND column_name = 'application_id'
    ) THEN
        ALTER TABLE tenant RENAME COLUMN product_id TO application_id;
    END IF;
END $$;

-- Ensure indexes/constraints use current names (idempotent).
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'tenant_domain'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_tenant_domain_tenant_id ON tenant_domain(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_tenant_domain_domain_code ON tenant_domain(domain_code);
        CREATE INDEX IF NOT EXISTS idx_tenant_domain_status ON tenant_domain(status);

        ALTER TABLE tenant_domain
            DROP CONSTRAINT IF EXISTS uk_tenant_module_tenant_module_code;

        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'uk_tenant_domain_tenant_domain_code'
        ) THEN
            ALTER TABLE tenant_domain
                ADD CONSTRAINT uk_tenant_domain_tenant_domain_code UNIQUE (tenant_id, domain_code);
        END IF;
    END IF;
END $$;
