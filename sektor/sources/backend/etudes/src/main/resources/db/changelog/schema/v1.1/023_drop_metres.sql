-- SEKTOR-111 : métrés hors code (DECISIONS-PRODUIT 17/08). Lab drop OK.

ALTER TABLE dpgf_noeuds DROP COLUMN IF EXISTS metre_ligne_id;
DROP INDEX IF EXISTS idx_dpgf_tenant_metre;
ALTER TABLE dpgf DROP COLUMN IF EXISTS metre_id;
ALTER TABLE devis DROP COLUMN IF EXISTS metre_id;
ALTER TABLE appels_offres_clients DROP COLUMN IF EXISTS metre_id;
ALTER TABLE appels_offres_clients DROP COLUMN IF EXISTS metre_numero;

DROP TABLE IF EXISTS metre_lignes;
DROP TABLE IF EXISTS metrees;
