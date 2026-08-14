CREATE TABLE IF NOT EXISTS photos_chantier (
    id              VARCHAR(100) PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    chantier_id     VARCHAR(100) NOT NULL,
    filename        VARCHAR(500) NOT NULL,
    content_type    VARCHAR(120) NOT NULL,
    storage_path    VARCHAR(1000) NOT NULL,
    lat             DOUBLE PRECISION,
    lng             DOUBLE PRECISION,
    zone            VARCHAR(200),
    taken_at        TIMESTAMPTZ NOT NULL,
    exif_json       JSONB,
    uploaded_by     VARCHAR(200) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_photos_chantier_chantier FOREIGN KEY (chantier_id) REFERENCES chantiers (id)
);

CREATE INDEX IF NOT EXISTS idx_photos_chantier_tenant_chantier
    ON photos_chantier (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_photos_chantier_tenant_zone
    ON photos_chantier (tenant_id, zone);

CREATE INDEX IF NOT EXISTS idx_photos_chantier_tenant_taken_at
    ON photos_chantier (tenant_id, taken_at);
