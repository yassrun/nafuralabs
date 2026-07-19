-- Affectation: employé × chantier × rôle chantier × période
CREATE TABLE IF NOT EXISTS chantier_affectation (
    id              VARCHAR(100) PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    chantier_id     VARCHAR(100) NOT NULL,
    employe_id      VARCHAR(100) NOT NULL,
    role_code       VARCHAR(50) NOT NULL,
    date_debut      DATE NOT NULL,
    date_fin        DATE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_chantier_affectation_chantier
        FOREIGN KEY (chantier_id) REFERENCES chantiers (id)
);

CREATE INDEX IF NOT EXISTS idx_chantier_affectation_tenant_chantier
    ON chantier_affectation (tenant_id, chantier_id);

CREATE INDEX IF NOT EXISTS idx_chantier_affectation_tenant_employe
    ON chantier_affectation (tenant_id, employe_id);

CREATE INDEX IF NOT EXISTS idx_chantier_affectation_role
    ON chantier_affectation (tenant_id, role_code);

-- One active assignment per (chantier, employe, role) at a time
CREATE UNIQUE INDEX IF NOT EXISTS uq_chantier_affectation_active
    ON chantier_affectation (tenant_id, chantier_id, employe_id, role_code)
    WHERE is_active = TRUE;
