---

id: SEKTOR-162
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
---

# Copier le déboursé du DPU sur les nœuds à la conversion

> MATIERE / MAIN_DOEUVRE / MATERIEL / SOUS_TRAITANCE par nœud vendu. Instantané daté : l'étude ne rétro-alimente plus.

## Étapes

- [ ] …

## Journal

```
24/08  constaté par l'orchestrateur, l'exec ne journalisant pas — après deux
       coupures d'infrastructure : créés DebourseNoeud, RubriqueDebourse,
       OrigineDebourse, DebourseNoeudRepository, changelog schema/v1.2/ ;
       modifié PosteBudgetaire. Le port etudes -> chantiers n'a pas encore bougé.
23/08 18:22  posée
23/08 21:47  status → doing
23/08 22:40  Domaine posé (chantiers) : `RubriqueDebourse` (4 rubriques DPU + part NON_VENTILE),
             `OrigineDebourse` (DECOMPOSE/FORFAIT/ESTIME/SAISI), entité `DebourseNoeud`
             (prevuHt figé + reviseHt) + `DebourseNoeudRepository`.
             Décidé : **le porteur du déboursé est le poste, jamais le lot** — AC-1 dit qu'un lot
             vaut la somme de ses enfants et ne se saisit pas ; un seul lieu d'écriture rend AC-9
             vrai par construction.
             `PosteBudgetaire` reçoit l'instantané (origine, non fiable, date de copie,
             prixDpuId + version) — les métadonnées sur le nœud, les montants dans les lignes.
             Schéma : `chantiers/db/changelog/schema/v1.2/001_debourse_par_noeud.sql`.
23/08 23:05  Port `etudes -> chantiers` retourné (`ChainageAvalPort`) : `BudgetRubrique` et le
             champ `budget` de `ConversionCommand` **supprimés** ; `LotProjection` gagne un
             `DebourseProjection` (origine, nonFiable, prixDpuId, prixDpuVersion, parts par
             rubrique). Renseigné sur les articles seulement — un lot n'a pas de déboursé propre.
             La **date de copie** n'est pas dans le port : l'aval la pose en écrivant, sinon elle
             daterait la lecture et non l'instantané (AC-5).
23/08 23:25  `BudgetVentilationService` -> `DebourseDuNoeudService` (etudes) : le calcul est le
             même, le niveau change — un déboursé **par article**, plus un agrégat par rubrique.
             Corrigé au passage : la base **PAR_JOUR** est enfin appliquée (÷ rendementJournalier,
             règle de `DpuCalculator`) ; l'ancien `lineComposant` l'ignorait et gonflait la
             sous-traitance/matériel d'un facteur égal à la production journalière.
             Décidé seul (AC-4) : la cible d'un poste est `coutUnitaire × quantité` — la vérité du
             devis. Après la répartition, le résidu ≤ 1 centime/part est absorbé par la plus
             grosse part (bruit d'arrondi) ; au-delà il tombe en **NON_VENTILE**, où il se voit,
             plutôt que d'être caché dans une rubrique. AC-4 devient vrai par construction.
             Anciens `BudgetVentilationService(.java/Test.java)` supprimés.
23/08 23:45  Côté chantiers : `DebourseNoeudService` (copie / saisie interne / révision / lecture),
             `DebourseNoeudDto`, `DebourseNoeudSaisieDto`, `DebourseNoeudController`
             (`GET|PUT /api/v1/postes-budgetaires/{id}/debourse` et `PUT …/debourse/revision`).
             `copierDepuisLEtude` **refuse une seconde copie** (`copie_deja_faite`) : c'est ce qui
             rend AC-5 vérifiable — aucune resynchronisation, ni auto ni à la demande.
             La lecture rend **toujours les quatre rubriques**, même à zéro ; NON_VENTILE
             n'apparaît que s'il existe et n'est **pas saisissable**.
             Reste : `DossierEtudeService` + `ChainageAvalAdapter`, puis compile.
24/08 00:05  Conversion recâblée : `DossierEtudeService.projeterLots` attache le déboursé au nœud,
             `ChainageAvalAdapter` pose la copie datée sur chaque poste et **n'écrit plus aucun
             budget par rubrique** (plus de `budgetService.upsert`). Lot d'accueil : `debourse`
             null, rien à copier.
             `nb-compile.sh chantiers etudes` → EXIT=0 sur les deux modules.
             Reste sur 162 : réparer les tests qui parlaient encore de `BudgetRubrique`, écrire
             les tests AC-2/AC-3/AC-4/AC-5/AC-7.
24/08 00:35  Tests. `DebourseNoeudServiceTest` (chantiers) 7/7 ; `DebourseDuNoeudServiceTest`
             (etudes) 9/9 ; `ChainageAvalAdapterTest` réécrit 8/8 ; `DossierEtudeChainageAvalTest`
             9/9. Les 3 tests etudes qui mockaient `BudgetVentilationService` repointés.
             Note connue confirmée : `PdfBordereauLayoutParserTest` / `ExtracteurTextePdfTest` ne
             compilent pas (pdfbox 2 vs 3 dans le cache plat) — pas ma régression, exclus du run.
24/08 00:45  Rapport de livraison écrit. status → review (feature : la QA tranche, SEKTOR-160).
```

## Rapport de livraison

**ce qui a changé** — `chantiers/` : `RubriqueDebourse`, `OrigineDebourse`, `DebourseNoeud` +
repository, `DebourseNoeudService`, `DebourseNoeudDto`, `DebourseNoeudSaisieDto`,
`DebourseNoeudController` ; `PosteBudgetaire` porte l'instantané ; schéma
`db/changelog/schema/v1.2/001_debourse_par_noeud.sql`. `etudes/` : `ChainageAvalPort` change de
forme (le déboursé voyage avec `LotProjection`, `BudgetRubrique` supprimé),
`BudgetVentilationService` → `DebourseDuNoeudService`, `DossierEtudeService.projeterLots` et
`ChainageAvalAdapter` recâblés — l'adapter ne fait plus **aucun** `budgetService.upsert`.
Aucun écran touché (l'écran budget tombe avec AC-8, dans SEKTOR-159).

**critères prouvés** — compilation `nb-compile.sh chantiers etudes` EXIT=0 ; JUnit sans Gradle :

| AC | Preuve exécutée |
|----|-----------------|
| AC-1 | `DebourseDuNoeudServiceTest.unLotNaPasDeDebourseAlui` (un lot n'a pas de déboursé propre) · `DebourseNoeudServiceTest.interne_saisieDesQuatreRubriques` (la lecture rend toujours les quatre) · `ChainageAvalAdapterTest.nEcritAucunBudgetParRubriqueAuChantier` |
| AC-2 | `decompose_chaqueComposantDansSaRubrique` · `decompose_composantJournalierRameneALUnite` (base `PAR_JOUR` ÷ `rendementJournalier`, cas réel « Déblais en masse » 27 DH/m³) · `ChainageAvalAdapterTest.poseLeDebourseDecomposeSurLeNoeud` |
| AC-3 | `forfait_toutEnSousTraitance` · `estimeDeduit_nonVentileEtNonFiable` · `decomposeSansComposants_nonVentile` · `articleSansDebourseNeBloquePasLaConversion` |
| AC-4 | `decompose_residuDArrondiAbsorbe_sommeExacte` (Σ rubriques == coût × qté au centime) · `decompose_journalierSansRendement_tombeEnNonVentile` · `sommeDebourseArticles_ignoreLesLots` |
| AC-5 | `DebourseNoeudServiceTest.copie_poseLesMontantsEtDateLInstantane` (origine, `prixDpuId`, version, date) · `copie_uneSeuleFois_laSecondeEstRefusee` |
| AC-6 | `interne_saisieDesQuatreRubriques` (origine `SAISI`, prévu = révisé) |
| AC-7 | `revision_neReecritPasLaCopie` (prévu 600 intouché, révisé 750, écart 150) · `vendu_saisieDuPrevuRefusee` |

Runs : chantiers 7/7 · etudes `DebourseDuNoeudServiceTest` 9/9 · `ChainageAvalAdapterTest` 8/8 ·
`DossierEtudeChainageAvalTest` 9/9 (non-régression conversion).

**décidé seul** —
1. **Le porteur du déboursé est le poste, jamais le lot.** AC-1 dit qu'un lot vaut la somme de ses
   enfants et ne se saisit pas : un seul lieu d'écriture rend AC-9 vrai par construction, au lieu
   d'un invariant à maintenir.
2. **La cible d'un poste est `coutUnitaire × quantité`** — la vérité du devis, pas la somme des
   composants. Après répartition, un résidu ≤ 1 centime par part est absorbé par la plus grosse
   part (bruit d'arrondi) ; au-delà il tombe en `NON_VENTILE`, où il se voit. AC-4 est vrai par
   construction et un DPU qui ne couvre pas son poste devient visible au lieu d'être lissé.
3. **La base `PAR_JOUR` est enfin appliquée.** `BudgetVentilationService.lineComposant`
   l'ignorait : un composant journalier était compté tel quel, gonflant sa rubrique d'un facteur
   égal à la production journalière. AC-2 l'exige ; la règle de `DpuCalculator` est reprise mot
   pour mot, y compris « sans rendement journalier, le composant est ignoré » — la part manquante
   retombe alors en non ventilé plutôt que de disparaître.
4. **La date de copie est posée par l'aval, pas transmise par le port.** Elle date l'écriture de
   l'instantané, pas sa lecture.
5. **Une seconde copie est refusée** (`copie_deja_faite`) plutôt qu'ignorée : AC-5 interdit toute
   resynchronisation, et un refus bruyant le prouve là où un no-op le supposerait.
6. **`NON_VENTILE` n'est pas saisissable.** C'est le constat d'un chiffrage qu'on n'a pas su
   décomposer, pas une cinquième case où poser un montant.
7. **Deux endpoints distincts** (`PUT …/debourse` saisie interne, `PUT …/debourse/revision`) :
   AC-6 et AC-7 sont deux gestes différents, et le second ne doit jamais pouvoir écrire le prévu.

**écarts / dette** —
- `budget_chantiers` / `budget_lignes`, `BudgetChantierService.upsert`, `POST …/budget` et
  `BudgetChantierSeedService` **existent encore** : plus personne ne les alimente à la conversion,
  mais leur suppression est AC-8, donc SEKTOR-159. Entre les deux tasks, l'écran budget lit un
  agrégat vide.
- **Le seed lab ne pose aucun déboursé sur les nœuds** (`PosteBudgetaireSeedService`). À faire
  avec SEKTOR-159, quand le seed budget par rubrique tombe — sinon l'écran est vide en lab.
- **Aucun écran retouché** : AC-7 déplace la révision sur le nœud, mais `reviser-budget-dialog`
  écrit toujours au chantier. Recâblage web avec SEKTOR-159.
- `PdfBordereauLayoutParserTest` / `ExtracteurTextePdfTest` (etudes) ne compilent pas hors Gradle
  (pdfbox 2 vs 3 dans le cache plat) — antérieur, exclu des runs, non touché.
