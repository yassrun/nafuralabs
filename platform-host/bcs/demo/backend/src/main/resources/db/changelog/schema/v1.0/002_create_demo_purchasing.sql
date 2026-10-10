-- bc.demo: purchasing (categories, suppliers, contacts, items, purchase requests) and projects

CREATE TABLE IF NOT EXISTS demo_category (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    code         VARCHAR(40) NOT NULL,
    name         VARCHAR(120) NOT NULL,
    parent_id    UUID REFERENCES demo_category(id) ON DELETE CASCADE,
    description  VARCHAR(500),
    created_by   UUID,
    updated_by   UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    version      BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_demo_category_tenant ON demo_category(tenant_id);

CREATE TABLE IF NOT EXISTS demo_supplier (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID NOT NULL,
    code           VARCHAR(40) NOT NULL,
    name           VARCHAR(160) NOT NULL,
    category_id    UUID REFERENCES demo_category(id) ON DELETE SET NULL,
    email          VARCHAR(160),
    phone          VARCHAR(20),
    ice            VARCHAR(15),
    rib            VARCHAR(24),
    city           VARCHAR(80),
    address        VARCHAR(300),
    country        VARCHAR(2) NOT NULL DEFAULT 'MA',
    vat_number     VARCHAR(40),
    active         BOOLEAN NOT NULL DEFAULT TRUE,
    payment_terms  VARCHAR(20),
    delivery_days  INTEGER,
    rating         INTEGER,
    notes          VARCHAR(2000),
    created_by     UUID,
    updated_by     UUID,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    version      BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_demo_supplier_tenant ON demo_supplier(tenant_id);

CREATE TABLE IF NOT EXISTS demo_supplier_contact (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    supplier_id  UUID NOT NULL REFERENCES demo_supplier(id) ON DELETE CASCADE,
    name         VARCHAR(120) NOT NULL,
    job_title    VARCHAR(120),
    email        VARCHAR(160),
    phone        VARCHAR(40),
    main_contact BOOLEAN NOT NULL DEFAULT FALSE,
    created_by   UUID,
    updated_by   UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    version      BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_demo_supplier_contact_supplier ON demo_supplier_contact(supplier_id);

CREATE TABLE IF NOT EXISTS demo_item (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL,
    code         VARCHAR(40) NOT NULL,
    name         VARCHAR(160) NOT NULL,
    category_id  UUID REFERENCES demo_category(id) ON DELETE SET NULL,
    unit         VARCHAR(20) NOT NULL,
    unit_price   NUMERIC(14, 2),
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    description  VARCHAR(2000),
    created_by   UUID,
    updated_by   UUID,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    version      BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_demo_item_tenant ON demo_item(tenant_id);

CREATE TABLE IF NOT EXISTS demo_purchase_request (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id          UUID NOT NULL,
    subject            VARCHAR(200) NOT NULL,
    supplier_id        UUID REFERENCES demo_supplier(id) ON DELETE SET NULL,
    amount             NUMERIC(14, 2),
    needed_by          DATE,
    justification      VARCHAR(2000),
    comment            VARCHAR(2000),
    rejection_reason   VARCHAR(2000),
    status             VARCHAR(30) NOT NULL,
    created_by         UUID,
    updated_by         UUID,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    version      BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_demo_purchase_request_tenant ON demo_purchase_request(tenant_id);

CREATE TABLE IF NOT EXISTS demo_project (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    name            VARCHAR(160) NOT NULL,
    client          VARCHAR(160) NOT NULL,
    city            VARCHAR(80),
    description     TEXT,
    budget          NUMERIC(14, 2),
    study_notes     VARCHAR(4000),
    quote_amount    NUMERIC(14, 2),
    quote_date      DATE,
    start_date      DATE,
    progress        INTEGER,
    closing_notes   VARCHAR(4000),
    status          VARCHAR(30) NOT NULL,
    created_by      UUID,
    updated_by      UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    version      BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_demo_project_tenant ON demo_project(tenant_id);
