-- L5 référentiel-catalogue : gel du prix sur composants_dpu
-- Voir sektor/docs/specs/epics/referentiel-catalogue-sektor/
-- Pas de FK vers catalogue : le gel doit survivre à la suppression de la source.
-- Pas de gel sur composants_ouvrage (L5 = DPU uniquement).

ALTER TABLE composants_dpu
    ADD COLUMN IF NOT EXISTS prix_source_ref_id UUID,
    ADD COLUMN IF NOT EXISTS prix_date_source DATE,
    ADD COLUMN IF NOT EXISTS prix_currency_id UUID,
    ADD COLUMN IF NOT EXISTS prix_libelle_source VARCHAR(500);
