-- SEKTOR-192 (continuite-etude-devis-chantier) AC-9 — provenance commerciale et snapshot initial
-- Posés une seule fois à la conversion depuis une étude GAGNE ; jamais modifiés par l'édition chantier.
-- Un chantier créé directement garde ces colonnes NULL (AC-17).

ALTER TABLE chantiers
    ADD COLUMN IF NOT EXISTS dossier_etude_id UUID,
    ADD COLUMN IF NOT EXISTS devis_id UUID,
    ADD COLUMN IF NOT EXISTS devis_numero VARCHAR(50),
    ADD COLUMN IF NOT EXISTS devis_version INTEGER,
    ADD COLUMN IF NOT EXISTS date_acceptation DATE,
    ADD COLUMN IF NOT EXISTS source_vente VARCHAR(20),
    ADD COLUMN IF NOT EXISTS montant_vente_initial_ht NUMERIC(18, 4),
    ADD COLUMN IF NOT EXISTS debourse_initial_ht NUMERIC(18, 4);

CREATE INDEX IF NOT EXISTS idx_chantiers_source_vente
    ON chantiers (tenant_id, source_vente)
    WHERE source_vente IS NOT NULL;
