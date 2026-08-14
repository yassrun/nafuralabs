-- L7 référentiel-catalogue : typage refs + conditionnement + prix normalisé
-- Voir sektor/docs/specs/epics/referentiel-catalogue-sektor/
-- Interdit : ComparateurFournisseurService / écran (L11).

-- 1. Typage fournisseur_id / article_id (VARCHAR → UUID)
ALTER TABLE catalogue_fournisseur_lignes
    ALTER COLUMN fournisseur_id TYPE UUID
    USING (
        CASE
            WHEN fournisseur_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                THEN fournisseur_id::uuid
            ELSE '00000000-0000-0000-0000-000000000001'::uuid
        END
    );

ALTER TABLE catalogue_fournisseur_lignes
    ALTER COLUMN article_id TYPE UUID
    USING (
        CASE
            WHEN article_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                THEN article_id::uuid
            ELSE '00000000-0000-0000-0000-000000000002'::uuid
        END
    );

-- 2. Remplacer uom VARCHAR par uom_id UUID (pas de mapping code → id fiable)
ALTER TABLE catalogue_fournisseur_lignes
    ADD COLUMN IF NOT EXISTS uom_id UUID;

ALTER TABLE catalogue_fournisseur_lignes
    DROP COLUMN IF EXISTS uom;

-- 3. Conditionnement + prix normalisé (calculé, jamais saisi)
ALTER TABLE catalogue_fournisseur_lignes
    ADD COLUMN IF NOT EXISTS conditionnement_quantite NUMERIC(18, 4);

ALTER TABLE catalogue_fournisseur_lignes
    ADD COLUMN IF NOT EXISTS conditionnement_uom_id UUID;

ALTER TABLE catalogue_fournisseur_lignes
    ADD COLUMN IF NOT EXISTS prix_normalise NUMERIC(18, 8);

ALTER TABLE catalogue_fournisseur_lignes
    ADD COLUMN IF NOT EXISTS uom_normalise_id UUID;
