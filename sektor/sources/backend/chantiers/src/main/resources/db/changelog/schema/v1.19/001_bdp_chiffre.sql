--liquibase formatted sql
--changeset sektor:chantiers-v1.19-bdp-chiffre

-- Le BDP chiffré du chantier est propre au chantier : il ne vient pas toujours du devis validé.
-- Une ligne vendue (quantité + prix, entre en situation) peut donc naître du BDP importé ou d'une
-- saisie de chiffrage, sans nœud DPGF d'origine. Le lien vers l'étude reste posé quand il existe.
-- Une ligne interne, elle, ne porte toujours ni origine ni prix de vente.
ALTER TABLE chantier_lots DROP CONSTRAINT IF EXISTS ck_chantier_lots_origine;
ALTER TABLE chantier_lots ADD CONSTRAINT ck_chantier_lots_origine CHECK (
    nature = 'VENDU'
    OR (nature = 'INTERNE' AND dpgf_noeud_id IS NULL)
);

ALTER TABLE postes_budgetaires DROP CONSTRAINT IF EXISTS ck_postes_budgetaires_origine;
ALTER TABLE postes_budgetaires ADD CONSTRAINT ck_postes_budgetaires_origine CHECK (
    nature = 'VENDU'
    OR (nature = 'INTERNE' AND dpgf_noeud_id IS NULL)
);
