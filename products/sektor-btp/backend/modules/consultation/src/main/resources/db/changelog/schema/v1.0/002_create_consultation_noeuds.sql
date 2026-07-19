CREATE TABLE IF NOT EXISTS consultation_noeuds (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL,
    consultation_id     UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    parent_id           UUID,
    type                VARCHAR(20) NOT NULL,
    code                VARCHAR(50),
    libelle             VARCHAR(500) NOT NULL,
    unite               VARCHAR(30),
    quantite            NUMERIC(18, 4),
    descriptif          TEXT,
    ordre               INTEGER NOT NULL DEFAULT 0,
    mode                VARCHAR(20),
    item_id             VARCHAR(100),
    item_code           VARCHAR(50),
    item_name           VARCHAR(255),
    item_status         VARCHAR(20),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultation_noeuds_consultation
    ON consultation_noeuds(tenant_id, consultation_id);

CREATE INDEX IF NOT EXISTS idx_consultation_noeuds_parent
    ON consultation_noeuds(parent_id);
