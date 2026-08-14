-- L4 référentiel-catalogue : dossier_intervenant + niveaux d'approbation
-- Voir sektor/docs/specs/epics/referentiel-catalogue-sektor/
-- Pas d'avis_execution (L8).

CREATE TABLE IF NOT EXISTS dossier_intervenant (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    dossier_etude_id    UUID NOT NULL REFERENCES dossiers_etude(id) ON DELETE CASCADE,
    user_id             VARCHAR(100) NOT NULL,
    nom                 VARCHAR(255),
    role                VARCHAR(30) NOT NULL,
    invite              BOOLEAN NOT NULL DEFAULT FALSE,
    premiere_action_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    derniere_action_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dossier_intervenant_role CHECK (
        role IN ('CHARGE_ETUDE', 'REVISEUR', 'AVIS', 'APPROBATEUR')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_dossier_intervenant_role
    ON dossier_intervenant (tenant_id, dossier_etude_id, user_id, role);

CREATE INDEX IF NOT EXISTS idx_dossier_intervenant_dossier
    ON dossier_intervenant (tenant_id, dossier_etude_id);

CREATE INDEX IF NOT EXISTS idx_dossier_intervenant_user
    ON dossier_intervenant (tenant_id, user_id);

-- Nombre de niveaux figé à la soumission (1 sous seuil, 2 au-dessus).
ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS niveaux_approbation INTEGER;
