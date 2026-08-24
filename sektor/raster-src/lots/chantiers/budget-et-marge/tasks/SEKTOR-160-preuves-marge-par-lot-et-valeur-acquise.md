---

id: SEKTOR-160
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
---

# Preuves — marge par lot et valeur acquise

> e2e : un chantier converti montre sa marge par lot, et l'écart valeur acquise / réel après imputation.

## Étapes

- [ ] …

## Journal

```
23/08 18:22  posée
23/08 23:19  status → doing
23/08 23:19  status → doing
23/08 23:20  Lu CONTRAT.md (15 AC), rapports de livraison SEKTOR-162 et SEKTOR-159. Début vérif.
23/08 23:22  Relu DpuCalculator.computeDeboursSec (règle PAR_JOUR : /rendementJournalier) et
             l'ancien BudgetVentilationService.lineComposant (git show HEAD, fichier supprimé
             du worktree) : confirmé bug réel — lineComposant renvoyait le total du composant
             tel quel, jamais divisé par le rendement journalier. Rejoué "Déblais en masse" à la
             main sur DebourseDuNoeudService.partUnitaire : (1500+200)/100 + 10 = 27 DH/m³,
             conforme au test decompose_composantJournalierRameneALUnite. Bug confirmé + fix
             confirmé.
23/08 23:24  nb-compile.sh chantiers etudes → EXIT=0 sur les deux modules (reproduit moi-même).
23/08 23:30  nb-test.sh etudes DebourseDuNoeudServiceTest (DEPS=chantiers) → 9/9 verts, reproduit
             moi-même. Couvre AC-2, AC-3, AC-4 côté calcul étude.
23/08 23:34  nb-test.sh etudes ChainageAvalAdapterTest (DEPS=chantiers) → 8/8. Couvre AC-1, AC-2,
             AC-8 (aucun budgetService.upsert appelé).
23/08 23:38  nb-test.sh etudes DossierEtudeChainageAvalTest (DEPS=chantiers) → 9/9. Non-régression
             conversion.
23/08 23:42  nb-test.sh chantiers (module complet, tout le package) → 51/51 verts. Couvre
             DebourseNoeudServiceTest, BudgetArbreServiceTest, ImputationCoutReelServiceTest,
             BudgetChantierServiceTest en une seule fois. Aucun échec.
23/08 23:55  Lecture de code (pas seulement les tests) : RubriqueDebourse (4 + NON_VENTILE,
             libellés en clair), OrigineDebourse, DebourseNoeud (prevuHt figé / reviseHt),
             PosteBudgetaire (instantané : origine, nonFiable, copieLe, prixDpuId/version),
             DebourseNoeudService (copierDepuisLEtude refuse la 2e copie ; reviser ne touche
             jamais prevuHt), BudgetArbreService (rollup poste->lot->chantier, marge null sur
             vendu=0, écart = debourseFait - reel, avancement plafonné 100%), BudgetChantierService
             (upsert lève IllegalStateException "agregat_non_stocke"), GlobalExceptionHandler
             (IllegalStateException -> 409). Aucune classe BudgetChantier/BudgetLigne dans
             domain/budget/ : seules CoutReelNoeud, DebourseNoeud, PosteBudgetaire sont @Entity.
             Tout concorde avec le rapport de livraison, rien de contredit.
23/09 00:05  AC-6/AC-10/AC-11 sans écran, vérifié par lecture : `budget.facade.ts` expose
             saisirDebourseInterne/imputerCoutReel/reviserNoeud ; seul reviserNoeud est appelé
             depuis budget-chantier-detail.page.ts (grep ciblé). Les deux autres méthodes ne sont
             appelées nulle part côté page → API prouvée par les tests backend, aucun écran.
             Confirme le constat de l'exec, pas un point à rouvrir.
23/09 00:10  AC-15 : grep -i sur sektor/sources/web/app/chantiers pour "valeur acquise|earned
             value|EVM|CV|SV|valeur planifiée|WBS|quotité|ventilation analytique" → 0 match.
             i18n/applications/erp/chantiers/fr.json → 0 match des mêmes termes interdits.
             reviser-budget-dialog.component.ts ligne 47-48 affiche bien "Déboursé prévu" /
             "Déboursé révisé", NON_VENTILE explicitement exclu de la saisie (ligne 105).
23/09 00:20  BudgetArbreServiceTest et ImputationCoutReelServiceTest relus en entier : chiffres
             AC-9 (rollup 12000 poste=lot=chantier), AC-12 (poste vendu 4000/40% ; interne
             vendu=0, marge=-2000, percent=null ; lot 15000-11000=4000), AC-13 (poste A
             40%*6000=2400 fait, réel 4000, écart -1600 ; poste B 80%*3000=2400 fait, réel 1000,
             écart +1400 ; lot -200 ; sans avancement écart -500) revérifiés à la main, corrects.
             Ces tests tournent dans le lot 51/51 déjà exécuté ci-dessus.
23/09 00:30  ChainageAvalAdapter.java relu en entier : aucun budgetService.upsert ;
             copierLeDebourse tolère un poste sans projection (reste à zéro, ne bloque pas —
             AC-3) ; "Frais de chantier" n'est jamais créé à la conversion (AC-11 : créé
             seulement à la 1re imputation non rattachée, dans
             ImputationCoutReelService.fraisDeChantier).
23/09 00:40  schema/v1.2/002_cout_reel_par_noeud.sql relu : DROP TABLE budget_lignes/budget_chantiers
             confirmé (AC-8) ; CHECK rubrique IN (les 4, sans NON_VENTILE) sur couts_reels_noeuds
             confirmé (NON_VENTILE non imputable en réel, posé en base). poste_id NOT NULL avec FK
             CASCADE, aucune colonne activité/zone/quotité (AC-10, AC-14).
23/09 00:50  npx tsc -p tsconfig.app.json --noEmit (sektor/sources/web) reproduit moi-même :
             565 erreurs, TOUTES TS6059, 0 autre code d'erreur. Compte identique à celui rapporté
             par l'exec — pas d'augmentation. Les lignes "Imported via …/chantiers/budget/…" ne
             sont que du contexte de la même erreur TS6059 (rootDir), aucune erreur propre au
             sous-lot.
23/09 01:05  Aucun e2e budget existant (`find sektor/e2e -iname "*budget*"` vide). Écrit
             `sektor/e2e/scripts/verify-budget-et-marge.mjs` : les 13 scénarios nommés par
             CONTRAT.md, endpoints réels (confirmés par lecture de code ci-dessus), marqué
             NON_EXECUTE en tête et dans le retour — aucun backend disponible, et l'état initial
             (étude GAGNE + devis validé conforme) n'est pas encore seedable (seed-qa-etudes.mjs
             est modifié par une autre session, non touché). `node --check` → syntaxe valide.
             AC-6/AC-10/AC-11 marqués explicitement "[API prouvée, aucun écran — attend le
             sous-lot d'écran]" dans les steps, ni passants sans réserve ni bloquants.
23/09 01:10  `node raster/t.mjs check` → 0 erreurs, 32 warnings préexistants sans rapport avec ce
             sous-lot (CH sans sous-lot Raster dans d'autres pacts). Rédaction du rapport final,
             puis done-agent sur SEKTOR-162 et SEKTOR-159, puis done-agent sur SEKTOR-160.
```

## Rapport de livraison

**Verdict : les 15 AC tiennent.** SEKTOR-162 (AC-1→AC-7) et SEKTOR-159 (AC-8→AC-15) passent en
`done-agent`. AC-6, AC-10, AC-11 sont tenus **par l'API seule** — aucun écran ne les porte, dette
assumée et nommée par le contrat (§ Hors périmètre), confirmée en lisant le code du front : ni
`saisirDebourseInterne` ni `imputerCoutReel` (`budget.facade.ts`) ne sont appelés depuis
`budget-chantier-detail.page.ts` — seul `reviserNoeud` l'est. Marqués « API prouvée, aucun écran »
dans le tableau, ni passants sans réserve ni bloquants.

**Le bug de calcul cité (`lineComposant`, base `PAR_JOUR` ignorée) est réel et corrigé.**
Confirmé par lecture : l'ancien `BudgetVentilationService.lineComposant` (`git show HEAD:…`,
fichier supprimé du worktree) renvoyait `rendement × prixUnitaire` tel quel, jamais divisé par
`rendementJournalier` — un composant chiffré à la journée (ex. tractopelle 1500 DH/j) était
compté comme si c'était un coût unitaire, puis multiplié par la quantité totale du poste au lieu
d'être ramené à l'unité d'ouvrage. Le nouveau `DebourseDuNoeudService.partUnitaire`
(`etudes/src/main/java/ma/nafura/etudes/service/DebourseDuNoeudService.java:155-171`) reprend
mot pour mot la règle de `DpuCalculator.computeDeboursSec` (÷ `rendementJournalier`). Rejoué à la
main le cas « Déblais en masse » : tractopelle 1500/j + pannes 200/j, rendement 100 m³/j, gasoil
10 DH/m³ déjà à l'unité → (1500+200)/100 + 10 = **27 DH/m³**, exactement ce que couvre
`DebourseDuNoeudServiceTest.decompose_composantJournalierRameneALUnite`, rejoué et vert (9/9 sur
la classe).

**Compilation et tests, rejoués moi-même (pas seulement lus dans le rapport de l'exec) :**

| Vérification | Résultat |
|---|---|
| `nb-compile.sh chantiers etudes` | EXIT=0 sur les deux modules |
| `nb-test.sh etudes DebourseDuNoeudServiceTest` (DEPS=chantiers) | 9/9 |
| `nb-test.sh etudes ChainageAvalAdapterTest` (DEPS=chantiers) | 8/8 |
| `nb-test.sh etudes DossierEtudeChainageAvalTest` (DEPS=chantiers) | 9/9 |
| `nb-test.sh chantiers` (suite complète) | **51/51** |
| `npx tsc -p tsconfig.app.json --noEmit` (sektor/sources/web) | 565 erreurs, **toutes** `TS6059` (bruit `rootDir` préexistant), 0 erreur réelle — compte identique à celui rapporté, pas d'augmentation |
| `node raster/t.mjs check` | 0 erreur, 32 warnings préexistants sans rapport |

**Tableau AC → preuve (SEKTOR-162, AC-1 à AC-7) :**

| AC | Preuve | Vérifié comment |
|----|--------|------------------|
| AC-1 | 4 rubriques + non ventilé sur chaque poste ; lot = somme des enfants, ne se saisit pas | Code : `RubriqueDebourse` (`AFFICHAGE`/`LES_QUATRE`), `DebourseNoeud` (porteur = poste uniquement), `BudgetArbreService.noeudDeLot` (agrégat des enfants, aucun montant propre). Tests : `DebourseDuNoeudServiceTest.unLotNaPasDeDebourseAlui`, `DebourseNoeudServiceTest.interne_saisieDesQuatreRubriques`, `ChainageAvalAdapterTest.nEcritAucunBudgetParRubriqueAuChantier` — verts |
| AC-2 | Copie du DPU, base `PAR_JOUR` ÷ `rendementJournalier` | Code : `DebourseDuNoeudService.partUnitaire` (lignes 155-171), règle identique à `DpuCalculator.computeDeboursSec`. Cas réel « Déblais en masse » rejoué à la main = 27 DH/m³. Test `decompose_composantJournalierRameneALUnite` vert |
| AC-3 | FORFAIT→SOUS_TRAITANCE, ESTIME/DECOMPOSE sans composants→NON_VENTILE, jamais bloquant | Code : `DebourseDuNoeudService.debourseDuNoeud` (switch origine). Tests `forfait_toutEnSousTraitance`, `estimeDeduit_nonVentileEtNonFiable`, `decomposeSansComposants_nonVentile` verts. `ChainageAvalAdapter.copierLeDebourse` tolère `debourse == null` (poste à zéro, conversion non bloquée) |
| AC-4 | Σ déboursés nœuds == Σ coût unitaire × quantité, au centime | Code : `debourseDeLaLigne` = cible unique, `reconcilier` absorbe le bruit d'arrondi (≤1cts/part) ou tombe en NON_VENTILE au-delà. Test `decompose_residuDArrondiAbsorbe_sommeExacte` (5,01→5,00) vert |
| AC-5 | Instantané daté, aucune resynchro | Code : `PosteBudgetaire.debourseCopieLe/deboursePrixDpuId/Version`, `DebourseNoeudService.copierDepuisLEtude` refuse si `debourseCopieLe != null` (`copie_deja_faite`). Tests `copie_poseLesMontantsEtDateLInstantane`, `copie_uneSeuleFois_laSecondeEstRefusee` verts |
| AC-6 | Interne saisi, origine SAISI | Code : `DebourseNoeudService.saisirSurNoeudInterne`, endpoint `PUT /api/v1/postes-budgetaires/{id}/debourse`. Test `interne_saisieDesQuatreRubriques` vert. **API prouvée, aucun écran** — ne l'appelle pas depuis la page |
| AC-7 | Révision côté, prévu jamais réécrit | Code : `DebourseNoeudService.reviser` (`touchePrevu=false`), endpoint `.../debourse/revision`. Test `revision_neReecritPasLaCopie` (600 prévu intouché, 750 révisé, écart 150) vert. Écran : `reviser-budget-dialog.component.ts` affiche bien les deux valeurs côte à côte |

**Tableau AC → preuve (SEKTOR-159, AC-8 à AC-15) :**

| AC | Preuve | Vérifié comment |
|----|--------|------------------|
| AC-8 | Plus d'agrégat stocké, écriture refusée | Code : aucune classe `BudgetChantier`/`BudgetLigne` dans `domain/budget/` (seules `CoutReelNoeud`, `DebourseNoeud`, `PosteBudgetaire` sont `@Entity`) ; `schema/v1.2/002_cout_reel_par_noeud.sql` fait `DROP TABLE budget_lignes`/`budget_chantiers` ; `BudgetChantierService.upsert` lève `IllegalStateException("chantiers.budget.agregat_non_stocke")` → `GlobalExceptionHandler` mappe en 409. Tests `ecritureDunBudgetParRubriqueAuChantier_refusee`, `lectureParRubrique_dériveeDeLArbre` verts |
| AC-9 | Rollup poste→lot→chantier sans écriture | Code : `BudgetArbreService.Agregat` (somme pure). Test `rollup_lePosteRemonteAuLotPuisAuChantier` (12000 poste=lot=chantier) rejoué et revérifié à la main, vert |
| AC-10 | Nœud + rubrique + montant + date, jamais activité/zone/quotité | Code : `CoutReelCreateDto`/`CoutReelNoeud` n'ont aucun champ de ce type ; contrainte SQL `ck_couts_reels_noeuds_rubrique` limite aux 4 rubriques (NON_VENTILE exclu en base). Tests `imputation_surUnNoeudEtUneRubrique`, `nonVentile_nEstPasUneCibleDImputation`, `noeudDUnAutreChantier_refuse` verts. **API prouvée, aucun écran** |
| AC-11 | Coût sans nœud → « Frais de chantier », créé à la 1ère imputation, ré-imputable | Code : `ImputationCoutReelService.fraisDeChantier` (lot+poste internes, créés à la demande, jamais à la conversion — confirmé par lecture de `ChainageAvalAdapter`, aucun appel à ce chemin). Tests `coutSansNoeud_creeFraisDeChantierALaPremiereImputation`, `reimputation_surLeBonNoeud` verts. **API prouvée, aucun écran** |
| AC-12 | Marge = vendu − déboursé, prévue/réelle, interne = -déboursé sans % | Code : `BudgetArbreService.totaux` (`pourcentDuVendu` rend `null` si vendu=0). Test `marge_lInterneMangeLaMargeDuLot` (poste 40%, interne -2000/null, lot 4000) rejoué à la main, correct |
| AC-13 | Déboursé fait = avancement×prévu, écart = fait−réel, 0 sans avancement | Code : `avancementEnQuantite` (plafond 100%), `totaux.ecartHt`. Test `ceQuiEstFait_ecartNegatifQuandOnDepassePlusQueLonProduit` (−1600 / +1400 / −200 au lot) rejoué à la main, correct. `sansAvancement_toutResteLisibleEtRienNEchoue` (écart −500, rien ne casse) vert |
| AC-14 | Tout juste sans planning | Code : aucun champ activité/zone/quotité dans les DTO/entités/tables du sous-lot. Tests dédiés + absence structurelle confirmée par lecture |
| AC-15 | Vocabulaire chantier, pas EVM | `grep -i` sur `sektor/sources/web/app/chantiers` et `i18n/applications/erp/chantiers/*.json` pour les 8 termes interdits → 0 match. `reviser-budget-dialog.component.ts:47-48` affiche "Déboursé prévu"/"Déboursé révisé", NON_VENTILE exclu de la saisie (ligne 105) |

**e2e** — aucun scénario du contrat n'est exécutable aujourd'hui (aucun backend Sektor
disponible). Écrit `sektor/e2e/scripts/verify-budget-et-marge.mjs` : les 13 scénarios nommés par
`CONTRAT.md`, endpoints réels confirmés par lecture de code, marqué `NON_EXECUTE` explicitement.
L'état initial (étude GAGNE + devis validé conforme) n'a pas de seed rejouable — `seed-qa-etudes.mjs`
est modifié par une autre session en cours, non touché ici pour ne pas entrer en collision.

**Rien de faux trouvé dans le code livré.** Chaque affirmation du rapport de livraison de
SEKTOR-162 et SEKTOR-159 a été recoupée avec le code source (pas seulement les tests) et, quand
c'était possible, rejouée : compilation, exécution JUnit, `tsc`, calculs à la main. Aucun écart.

**Dette héritée, non résolue ici (rappel, pas un blocage pour ce sous-lot) :**
- AC-6, AC-10, AC-11 sans écran — sous-lot d'écran à venir.
- `stock-budget-sync` / drilldown matière web alimentent des rubriques obsolètes
  (`MATERIAUX`/`LOCATION_MATERIEL`…), jamais persistées côté serveur — `matiere-et-magasin` (vague 2).
- L'engagé reste à zéro partout (Achats ne l'alimente pas) — hors périmètre nommé.
- Suite `etudes` rouge sous le runner sans Gradle (préexistant, confirmé sur un fichier non touché) —
  seuls les 3 fichiers `etudes` modifiés par SEKTOR-162/159 ont été rejoués ici, tous verts.
