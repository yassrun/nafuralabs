CREATE TABLE IF NOT EXISTS probe_group (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(40) NOT NULL,
    name        VARCHAR(120) NOT NULL,
    parent_id   UUID,
    created_by  UUID,
    updated_by  UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS probe_record (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(40) NOT NULL,
    group_id    UUID REFERENCES probe_group(id) ON DELETE SET NULL,
    amount      NUMERIC(14, 2),
    status      VARCHAR(30),
    reference   VARCHAR(60),
    created_by  UUID,
    updated_by  UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
