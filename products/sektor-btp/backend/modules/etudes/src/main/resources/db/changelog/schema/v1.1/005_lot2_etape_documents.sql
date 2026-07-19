-- L'étape « Descriptifs » disparaît, « Documents du marché » devient l'étape 1.
--
-- Ancien parcours : 1 Bordereau · 2 Descriptifs · 3 Décomposition · 4 Consultation · 5 Chiffrage
-- Nouveau parcours : 1 Documents · 2 Bordereau · 3 Décomposition · 4 Consultation · 5 Chiffrage
--
-- La révision du 2026-07-19 (00-ARCHITECTURE.md §4) a retiré l'appariement global CPS ↔ articles
-- par code : un CPS est de la prose par chapitres, pas une table indexée. Le back ne l'avait
-- jamais suivie, si bien que l'étape 1 réclamait des articles que seule l'étape suivante peut
-- créer — le parcours était sans issue.
--
-- Correspondance retenue :
--   ancien 1 (Bordereau)    → 2 (Bordereau)     même étape métier, nouveau rang
--   ancien 2 (Descriptifs)  → 2 (Bordereau)     l'étape n'existe plus ; on recule plutôt que
--                                               de faire sauter une vérification
--   ancien 3, 4, 5          → inchangés         mêmes étapes, mêmes rangs
--
-- Reculer un dossier ne lui fait rien perdre : `current_step` est une position de parcours, pas
-- un acquis. Les gates restent évaluées sur les données réelles.

UPDATE dossiers_etude
SET current_step = 2
WHERE current_step <= 2;
