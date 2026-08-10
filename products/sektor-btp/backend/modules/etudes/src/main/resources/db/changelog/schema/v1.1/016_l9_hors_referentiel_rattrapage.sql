-- L9 référentiel-catalogue : hors_referentiel + demandes création article
-- Voir products/sektor-btp/docs/specs/epics/referentiel-catalogue-sektor/
-- Interdit : L10 récursion, L12 biblio, L15 rapprochement auto.

ALTER TABLE composants_dpu
    ADD COLUMN IF NOT EXISTS hors_referentiel BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_composants_dpu_rattrapage
    ON composants_dpu (tenant_id, reference_type, hors_referentiel)
    WHERE reference_type = 'LIBRE' AND hors_referentiel = false;

CREATE TABLE IF NOT EXISTS demande_creation_article (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    dossier_etude_id    UUID NOT NULL REFERENCES dossiers_etude(id) ON DELETE CASCADE,
    libelle             VARCHAR(500) NOT NULL,
    nature              VARCHAR(30) NOT NULL,
    uom_code            VARCHAR(30),
    statut              VARCHAR(20) NOT NULL DEFAULT 'OUVERTE',
    auteur_user_id      VARCHAR(100),
    composant_ids_json  TEXT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_demande_creation_statut CHECK (statut IN ('OUVERTE', 'APPROUVEE', 'REFUSEE'))
);

CREATE INDEX IF NOT EXISTS idx_demande_creation_dossier
    ON demande_creation_article (tenant_id, dossier_etude_id, statut);
