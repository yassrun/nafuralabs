-- SEKTOR-191 (continuite-etude-devis-chantier) AC-6 — journal métier des transitions
-- Étude et devis : ancien statut, nouveau statut, acteur, date, corrélation d'un même geste.

CREATE TABLE IF NOT EXISTS transitions_etude (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    entite_type     VARCHAR(20) NOT NULL,
    entite_id       VARCHAR(100) NOT NULL,
    ancien_statut   VARCHAR(30) NOT NULL,
    nouveau_statut  VARCHAR(30) NOT NULL,
    correlation_id  UUID NOT NULL,
    motif           VARCHAR(1000),
    acteur          VARCHAR(100) NOT NULL,
    date_transition TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transitions_etude_correlation
    ON transitions_etude (tenant_id, correlation_id, date_transition);

CREATE INDEX IF NOT EXISTS idx_transitions_etude_entite
    ON transitions_etude (tenant_id, entite_type, entite_id, date_transition);
