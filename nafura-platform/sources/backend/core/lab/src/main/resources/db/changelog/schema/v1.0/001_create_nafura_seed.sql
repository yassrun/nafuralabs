-- Data sets (META-INF/nafura/seed/*.json) applied to each organization; re-applied only when their content changes.
CREATE TABLE IF NOT EXISTS nafura_seed (
    tenant_id   UUID NOT NULL,
    dataset_id  VARCHAR(120) NOT NULL,
    checksum    VARCHAR(64) NOT NULL,
    inserted    INTEGER NOT NULL,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tenant_id, dataset_id)
);
