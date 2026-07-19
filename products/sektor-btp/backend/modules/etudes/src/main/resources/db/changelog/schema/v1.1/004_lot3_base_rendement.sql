-- Base mixte du rendement — constatee sur le sous-detail reel de l'entreprise.
--
-- Source : classeur « LOT N° 2 GROS-OEUVRE — REVETEMENTS ETANCHEITE — PEINTURE », 2026-07-19.
--
-- Un meme ouvrage melange deux facons de compter :
--   * PAR_UNITE : le rendement est deja rapporte a l'unite d'ouvrage
--                 (coffreur 0,5 jour par m3)
--   * PAR_JOUR  : le composant est chiffre a la journee, ramene a l'unite en divisant par la
--                 production journaliere de l'ouvrage
--                 (betonniere + tracteur + equipe = 2 250 DH/jour ÷ 30 m3/jour = 75 DH/m3)
--
-- Les deux coexistent : sur « Deblais en masse », la tractopelle et les pannes sont
-- journalieres (÷ 100 m3/jour) tandis que le gasoil est deja au m3 —
-- (1500 + 200)/100 + 10 = 27 DH/m3.
--
-- Le modele ne supposait qu'une base unitaire. Sans cette colonne, un cout de journee serait
-- additionne tel quel a des couts unitaires et gonflerait le deboursé d'un facteur egal a la
-- production journaliere.

ALTER TABLE composants_dpu
    ADD COLUMN IF NOT EXISTS base_rendement VARCHAR(20);

-- Retrocompatible : l'existant est au rendement unitaire, qui reste le cas le plus courant.
UPDATE composants_dpu SET base_rendement = 'PAR_UNITE' WHERE base_rendement IS NULL;

ALTER TABLE composants_dpu
    ADD CONSTRAINT composants_dpu_base_chk
    CHECK (base_rendement IS NULL OR base_rendement IN ('PAR_UNITE', 'PAR_JOUR'));

-- Production journaliere de l'ouvrage, dans son unite (30 m3/jour, 100 m3/jour, 50 ml/jour).
-- C'est la forme dans laquelle l'entreprise raisonne : elle coute une journee d'equipe
-- complete, puis divise par ce qu'elle produit — plutot que d'exprimer des heures par m3.
ALTER TABLE prix_dpu
    ADD COLUMN IF NOT EXISTS rendement_journalier NUMERIC(18, 4);

-- Meme notion cote bibliotheque : un ouvrage type capitalise doit conserver son rendement.
ALTER TABLE composants_ouvrage
    ADD COLUMN IF NOT EXISTS base_rendement VARCHAR(20);

ALTER TABLE ouvrages
    ADD COLUMN IF NOT EXISTS rendement_journalier NUMERIC(18, 4);
