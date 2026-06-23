CREATE TABLE IF NOT EXISTS partners (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    code                VARCHAR(30) NOT NULL,
    raison_sociale      VARCHAR(255) NOT NULL,
    forme_juridique     VARCHAR(50),
    ice                 VARCHAR(15),
    identifiant_fiscal  VARCHAR(8),
    registre_commerce   VARCHAR(50),
    patente             VARCHAR(50),
    cnss                VARCHAR(20),
    amo                 VARCHAR(20),
    email               VARCHAR(255),
    phone               VARCHAR(50),
    website             VARCHAR(255),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_tenant ON partners(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_partners_code_tenant ON partners(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_partners_raison_sociale ON partners(tenant_id, raison_sociale);
CREATE INDEX IF NOT EXISTS idx_partners_ice ON partners(tenant_id, ice);
