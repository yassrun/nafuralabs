-- Geo referential (cap.geo): countries, regions, cities, addresses — mirrors ma.nafura.geo entities.

CREATE TABLE IF NOT EXISTS countries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(3) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    is_active   BOOLEAN,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_countries_tenant ON countries(tenant_id);

CREATE TABLE IF NOT EXISTS region (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    country_id  UUID NOT NULL,
    code        VARCHAR(50) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    description VARCHAR(255),
    is_active   BOOLEAN,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_region_tenant ON region(tenant_id);

CREATE TABLE IF NOT EXISTS city (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    country_id  UUID,
    region_id   UUID,
    code        VARCHAR(50),
    name        VARCHAR(200) NOT NULL,
    description VARCHAR(255),
    is_active   BOOLEAN,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_city_tenant ON city(tenant_id);

CREATE TABLE IF NOT EXISTS address (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    country_id  UUID,
    region_id   UUID,
    city_id     UUID,
    line1       VARCHAR(255),
    line2       VARCHAR(255),
    postal_code VARCHAR(20),
    description VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_address_tenant ON address(tenant_id);
