# Plan — raffinement Études

## But livrable

Rendre Études fiable de bout en bout : une progression contrôlée, une IA explicable et récupérable, un chiffrage lisible, puis une décision avant devis.

## Ordre d'exécution

1. **SEKTOR-202** — unifier complétude, anomalies et gates. Gate humaine : elle engage la définition de « prêt à avancer ».
2. **SEKTOR-203** — fiabiliser états, provenance, confiance, revue et reprise des gestes IA.
3. **SEKTOR-204** — fermer la frontière IA → Catalogue → tarif → DPU avec idempotence et résultat honnête.
4. **SEKTOR-205** — refondre le workspace de chiffrage sur ces contrats.
5. **SEKTOR-206** — corriger et rendre décisionnelle la liste Études, desktop et mobile.
6. **SEKTOR-207** — transformer la synthèse en porte de décision avant devis.
7. **SEKTOR-208** — verdict Mode B complet, voie manuelle et voie IA.

## Frontières

- Études possède dossier, DPGF, DPU, phases, anomalies et décision.
- Catalogue possède identité Sektor, Item tenant, unité et ItemPrice ; Études ne les écrit pas directement.
- Documents/LLM sont des capabilities derrière ports ; le domaine Études ne dépend ni de Gemini ni d'un format fournisseur.
- Consultation reste un objet Achats ; Études lit uniquement la couverture publiée.
- Devis commence après la décision ; ce lot ne redéfinit pas le contrat transverse déjà spécifié.

## Stratégie

- D'abord le read model de complétude : toute UX suivante doit consommer une vérité stable.
- Ensuite les contrats IA et Catalogue, avant de maquettiser leur revue.
- UI par composition progressive, pas réécriture des composants métier déjà corrects.
- Aucun correctif opportuniste dans les fichiers Chantier actuellement travaillés par un autre agent.

## Preuves de sortie

- Tests domaine/API de chaque `AC-n`, idempotence et permissions.
- Tests composants des états IA et sauvegarde.
- Parcours Mode B avec données/fichiers créés par la preuve, pas par dépendance à un seed favorable.
- Captures desktop et 390 × 844.
- `node raster/t.mjs check` sans erreur.

