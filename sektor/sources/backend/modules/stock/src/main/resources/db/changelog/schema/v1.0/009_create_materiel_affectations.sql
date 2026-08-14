CREATE TABLE IF NOT EXISTS materiel_affectations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    materiel_id     UUID NOT NULL,
    materiel_name   VARCHAR(255),
    location_id     UUID,
    location_name   VARCHAR(200),
    chantier_ref    VARCHAR(100) NOT NULL,
    date_debut      DATE NOT NULL,
    date_fin        DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_materiel_affectations_tenant ON materiel_affectations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_materiel_affectations_materiel ON materiel_affectations(tenant_id, materiel_id, status);
CREATE INDEX IF NOT EXISTS idx_materiel_affectations_chantier ON materiel_affectations(tenant_id, chantier_ref, status);
