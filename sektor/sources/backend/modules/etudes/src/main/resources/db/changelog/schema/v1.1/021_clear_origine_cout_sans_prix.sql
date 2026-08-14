-- ERP-66 : ne pas afficher « Estimé » sur des postes non chiffrés.
-- Les articles stampés ESTIME à l'import sans prix/coût redeviennent sans origine.
UPDATE dpgf_noeuds
SET origine_cout = NULL,
    estimation_saisie_en = NULL
WHERE type = 'ARTICLE'
  AND origine_cout IS NOT NULL
  AND (prix_unitaire IS NULL OR prix_unitaire <= 0)
  AND (cout_unitaire IS NULL OR cout_unitaire <= 0);

COMMENT ON COLUMN dpgf_noeuds.origine_cout IS
    'DECOMPOSE | FORFAIT | ESTIME — NULL tant que le poste n''est pas chiffré';
