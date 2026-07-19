CREATE TABLE IF NOT EXISTS consultation_composants (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID NOT NULL,
    noeud_id              UUID NOT NULL REFERENCES consultation_noeuds(id) ON DELETE CASCADE,
    type                  VARCHAR(30) NOT NULL,
    designation           VARCHAR(500) NOT NULL,
    unite                 VARCHAR(30),
    quantite_indicative   NUMERIC(18, 4),
    item_id               VARCHAR(100),
    item_code             VARCHAR(50),
    item_name             VARCHAR(255),
    item_status           VARCHAR(20),
    ordre                 INTEGER NOT NULL DEFAULT 0,
    source                JSONB,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consultation_composants_noeud
    ON consultation_composants(noeud_id);
