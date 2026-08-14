-- L8 référentiel-catalogue : avis d'exécution
-- Voir sektor/docs/specs/epics/referentiel-catalogue-sektor/
-- Pas de composant_dpu_id (2ᵉ temps). Pas de réécriture circuit L4.

CREATE TABLE IF NOT EXISTS avis_execution (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    dossier_etude_id    UUID NOT NULL REFERENCES dossiers_etude(id) ON DELETE CASCADE,
    dpgf_noeud_id       UUID NOT NULL,
    niveau              VARCHAR(20) NOT NULL,
    commentaire         VARCHAR(2000),
    ecart_propose       NUMERIC(18, 4),
    auteur_user_id      VARCHAR(100) NOT NULL,
    auteur_nom          VARCHAR(255),
    statut              VARCHAR(20) NOT NULL DEFAULT 'OUVERT',
    motif_traitement    VARCHAR(2000),
    traite_par          VARCHAR(100),
    traite_le           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_avis_execution_niveau CHECK (
        niveau IN ('REALISABLE', 'DIFFICILE', 'IRREALISABLE')
    ),
    CONSTRAINT chk_avis_execution_statut CHECK (
        statut IN ('OUVERT', 'PRIS_EN_COMPTE', 'ECARTE')
    )
);

CREATE INDEX IF NOT EXISTS idx_avis_execution_dossier_statut
    ON avis_execution (tenant_id, dossier_etude_id, statut);

CREATE INDEX IF NOT EXISTS idx_avis_execution_noeud
    ON avis_execution (tenant_id, dpgf_noeud_id);
