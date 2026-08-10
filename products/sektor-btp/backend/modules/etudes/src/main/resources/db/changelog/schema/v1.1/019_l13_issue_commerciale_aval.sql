-- L13 référentiel-catalogue : issue commerciale + liens aval
-- Voir products/sektor-btp/docs/specs/epics/referentiel-catalogue-sektor/
-- Interdit : L14 catalogue, FK vers tables tenant du catalogue.

ALTER TABLE dossiers_etude
    ADD COLUMN IF NOT EXISTS date_attribution DATE,
    ADD COLUMN IF NOT EXISTS reference_marche VARCHAR(100),
    ADD COLUMN IF NOT EXISTS montant_attribue NUMERIC(18, 4),
    ADD COLUMN IF NOT EXISTS motif_perte VARCHAR(40),
    ADD COLUMN IF NOT EXISTS concurrent_retenu VARCHAR(200),
    ADD COLUMN IF NOT EXISTS ecart_prix_estime NUMERIC(18, 4),
    ADD COLUMN IF NOT EXISTS chantier_genere_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS marche_genere_id VARCHAR(100);

ALTER TABLE dossiers_etude DROP CONSTRAINT IF EXISTS chk_dossiers_motif_perte;
ALTER TABLE dossiers_etude
    ADD CONSTRAINT chk_dossiers_motif_perte CHECK (
        motif_perte IS NULL OR motif_perte IN (
            'PRIX', 'DELAI', 'TECHNIQUE', 'ADMINISTRATIF', 'SANS_SUITE'
        )
    );

CREATE INDEX IF NOT EXISTS idx_dossiers_chantier_genere
    ON dossiers_etude (tenant_id, chantier_genere_id)
    WHERE chantier_genere_id IS NOT NULL;
