CREATE TABLE IF NOT EXISTS materiels (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL,
    code                    VARCHAR(50) NOT NULL,
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,
    famille_id              VARCHAR(50),
    famille_name            VARCHAR(100),
    marque                  VARCHAR(100),
    modele                  VARCHAR(100),
    numero_serie            VARCHAR(100) NOT NULL,
    annee_mise_en_service   INTEGER,
    puissance_capacite      VARCHAR(100),
    status                  VARCHAR(30) NOT NULL DEFAULT 'DISPONIBLE',
    date_dernier_entretien  DATE,
    prochaine_maintenance   DATE,
    notes_maintenance       TEXT,
    chantier_actuel_id      VARCHAR(50),
    chantier_actuel_name    VARCHAR(200),
    is_active               BOOLEAN NOT NULL DEFAULT true,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_materiels_tenant_code ON materiels(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_materiels_tenant_status ON materiels(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_materiels_tenant_famille ON materiels(tenant_id, famille_id);
