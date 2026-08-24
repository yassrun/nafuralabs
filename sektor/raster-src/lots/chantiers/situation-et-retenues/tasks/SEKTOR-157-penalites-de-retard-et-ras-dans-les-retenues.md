---
id: SEKTOR-157
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
---

# Pénalités de retard et RAS dans les retenues

> Le chantier porte déjà tauxRas. Ajouter pénalités et RAS à la cascade RG / avance, ordre d'application fixe.

## Étapes

- [ ] …

## Journal

```
23/08 18:22  posée
24/08 12:01  status → doing
24/08 (auto)  Backend déjà écrit dans le même passage que SEKTOR-156 (fichiers partagés) : computeFinancialTotals prend penalitesRetardHt/rasTaux, cascade AC-10 (pénalités → assiette RG/avance → net HT → TVA → net TTC → RAS informative) ; SituationTravaux/SituationTravauxDto portent penalitesRetardHt, rasTaux, rasMontant ; resolveRetenueAvancePercent corrigé (chantier.getTauxAvance() au lieu de la constante "5") ; generate(chantierId, numeroOrdre, penalitesRetardHt) exposé par le contrôleur (RequestParam optionnel). Tests unitaires computeFinancialTotalsAppliesFixedCascade et computeFinancialTotalsAtZeroPenalitesEtRas ajoutés — nb-test.sh chantiers 76/76.
24/08 (auto)  Vérifié AC-11 sur le port réel : VentesSituationFactureAdapter → FactureClientService.createFromSituation ne lit ni rasTaux ni rasMontant, seulement tvaTaux/retenueGarantiePercent/retenueAvanceMontant/lignes — SituationToFacturePort non modifié, RAS jamais transmise à Ventes.
24/08 (auto)  Web : Situation/DecompteValues/ApiSituation étendus (penalitesRetardHt, rasTaux, rasMontant) ; decompte-card, decompte-print et situation-print affichent pénalités (avant RG, AC-10) et RAS (ligne informative après net TTC, jamais déduite). Corrigé au passage un bug de decompteLive (situation-detail.page.ts) : sommait les montants de ligne comme un cumul alors qu'ils sont désormais des montants de période (AC-3) — cumulCourantHt était donc doublement faux pour toute situation réelle affichée, pas seulement l'aperçu. SituationApiService.create() poste penalitesRetardHt en query param.
24/08 (auto)  Vérification : nb-compile.sh chantiers+ventes+etudes OK ; tsc --noEmit ciblé sur sektor/sources/web (tsconfig.app.json) — 0 erreur touchant les fichiers modifiés (les 565 TS6059 restantes sont un problème de rootDir monorepo préexistant sur situations.routes.ts, sans lien avec ce changement, non introduites ici).
24/08 12:24  status → review
24/08 12:33  status → done-agent · gate none → done-me
```

## Rapport de livraison

ce qui a changé — `SituationGenerationService.computeFinancialTotals` implémente la cascade fixe d'AC-10 (pénalités saisies → assiette RG/avance réduite → net HT → TVA → net TTC inchangé pour `SituationToFacturePort` → RAS informative dérivée de `Chantier.tauxRas`) ; `resolveRetenueAvancePercent` corrigé (retourne `chantier.getTauxAvance()`, plus la constante `"5"`). `SituationTravaux`/`SituationTravauxDto`/`SituationLigneDto` portent `penalitesRetardHt`, `rasTaux`, `rasMontant`. `generate()` a une surcharge à 3 arguments (`penalitesRetardHt`), exposée par `SituationTravauxChantierController` en `RequestParam` optionnel. Web `chantiers/situations` : `decompte-card`, `decompte-print`, `situation-print` affichent les deux nouvelles lignes au bon endroit de la cascade.
critères prouvés — AC-8 (montant saisi, zéro par défaut, jamais dérivé — passé en paramètre explicite, jamais calculé depuis un planning), AC-9 (`rasTaux` vient de `chantier.getTauxRas()`, jamais un champ saisi sur la situation ; `null` → RAS zéro, testé dans `computeFinancialTotalsAtZeroPenalitesEtRas`), AC-10 (`computeFinancialTotalsAppliesFixedCascade` vérifie l'assiette réduite des pénalités, l'ordre RG/avance/TVA/RAS et les montants exacts), AC-11 (vérifié sur le port réel : `VentesSituationFactureAdapter`/`FactureClientService.createFromSituation` ne lisent jamais `rasTaux`/`rasMontant`, `SituationToFacturePort` non modifié), AC-12 (`computeFinancialTotalsAtZeroPenalitesEtRas` : cascade calculable à zéro, RAS à zéro, rien d'obligatoire). `nb-test.sh chantiers` : 76/76.
décidé seul — le gros du code d'AC-8→AC-12 a été écrit dans le même passage que SEKTOR-156 (même fichier `SituationGenerationService.java`, même migration SQL v1.6) : journalisé sous SEKTOR-156 au moment de l'écriture, référencé ici. J'ai aussi ajouté l'affichage RAS/pénalités dans les trois composants d'impression/décompte du web, alors que le contrat ne l'exige pas comme AC strict (seul AC-11 dit « lisible à l'écran ») — jugé nécessaire pour que la ligne existe quelque part côté utilisateur, pas seulement en base. En le faisant j'ai corrigé un bug préexistant de `decompteLive` (situation-detail.page.ts) qui traitait `montantHt` de ligne comme une valeur cumulée — vrai avant ce contrat, faux depuis qu'AC-3 en fait une valeur de période ; sans la correction, `cumulCourantHt` affiché à l'écran aurait été faux pour toute situation réelle, pas seulement l'aperçu de création.
écarts / dette — aucun écran de saisie des pénalités n'existe (explicitement hors périmètre du contrat) ; `SituationApiService.create()` poste `penalitesRetardHt: 0` faute d'un tel écran — la génération reste donc toujours à pénalités nulles depuis l'UI aujourd'hui, l'API backend accepte déjà le paramètre. Le `Chantier` web (modèle TS) n'expose pas `tauxRas`, donc l'aperçu client pré-génération (`generateLignesFromLots`/prefill) ne peut pas afficher de RAS avant clic sur « générer » — seule la vue d'une situation déjà générée (via `getById`) la montre, ce qui suffit puisque cet aperçu n'est de toute façon jamais soumis au serveur (dette déjà notée dans SEKTOR-156).
