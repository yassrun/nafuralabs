-- SEKTOR-218 — journal des suggestions IA contextuelles au dossier ouvert (AC-16).

CREATE TABLE IF NOT EXISTS dossier_agent_suggestions (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    dossier_etude_id    UUID NOT NULL REFERENCES dossiers_etude(id) ON DELETE CASCADE,
    action_type         VARCHAR(40) NOT NULL,
    libelle             VARCHAR(500) NOT NULL,
    etat                VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    provenance_json     TEXT,
    correction_note     VARCHAR(500),
    fingerprint         VARCHAR(64) NOT NULL,
    acteur              VARCHAR(100),
    decided_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dossier_agent_action_type CHECK (
        action_type IN ('CHIFFRAGE', 'INCOHERENCES', 'RATTACHEMENTS_CATALOGUE')
    ),
    CONSTRAINT chk_dossier_agent_etat CHECK (
        etat IN ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE', 'CORRIGEE')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_dossier_agent_suggestion_fingerprint
    ON dossier_agent_suggestions (tenant_id, dossier_etude_id, fingerprint);

CREATE INDEX IF NOT EXISTS idx_dossier_agent_suggestions_dossier
    ON dossier_agent_suggestions (tenant_id, dossier_etude_id, created_at DESC);
