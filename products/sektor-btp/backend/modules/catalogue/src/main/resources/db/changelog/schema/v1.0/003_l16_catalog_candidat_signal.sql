-- L16 — signaux d'enrichissement (hash tenant, pas de tenant_id)
-- Permet d'incrémenter nb_tenants_confirmants sans stocker d'identité client.

CREATE TABLE catalog_candidat_signal (
    id              UUID PRIMARY KEY,
    candidat_id     UUID NOT NULL REFERENCES catalog_candidats (id) ON DELETE CASCADE,
    tenant_hash     VARCHAR(64) NOT NULL,
    libelle_anonyme VARCHAR(300) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_catalog_candidat_signal UNIQUE (candidat_id, tenant_hash)
);

CREATE INDEX idx_catalog_candidat_signal_hash ON catalog_candidat_signal (tenant_hash);

COMMENT ON TABLE catalog_candidat_signal IS 'L16 — confirmation anonymisée ; jamais de tenant_id';
