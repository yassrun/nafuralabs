---

id: SEKTOR-159
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
---

# Marge et valeur acquise par nœud

> Imputation palier 1 sur le nœud. Avancement x déboursé prévu comparé au réel. Le budget par rubrique au chantier cesse d'être stocké.

## Étapes

- [ ] …

## Journal

```
23/08 18:22  posée
23/08 22:34  status → doing
24/08 01:00  Repérage court, ce que je vais réutiliser plutôt que réinventer :
             · `AvancementPhysique` porte déjà `posteId` + `quantiteRealisee` → AC-13 lit
               l'avancement **en quantité** de là, sans toucher au sous-lot voisin ;
             · `GlobalExceptionHandler` (platform) mappe `IllegalStateException` → 409 avec le
               message métier → AC-8 refuse le `POST …/budget` sans machinerie nouvelle ;
             · consommateurs de l'agrégat à recâbler : `ChantierKpiService`,
               `ChantierSummaryReadService`, `BudgetChantierSeedService`, écran web budget.
             Plan : coût réel -> rollup -> imputation/Frais de chantier -> suppression AC-8 -> web.
24/08 01:30  Écrits : `CoutReelNoeud` + repo + `schema/v1.2/002_cout_reel_par_noeud.sql` (qui
             **DROP** `budget_lignes` / `budget_chantiers` — AC-8, lab métier sans reprise) ;
             `BudgetArbreService` (rollup poste -> lot -> chantier, marge prévue/réelle,
             avancement en quantité, déboursé fait, écart) + `BudgetArbreDto` ;
             `ImputationCoutReelService` + `CoutReelCreateDto`.
             Décidé seul : « Frais de chantier » = **lot interne `FRAIS` portant un poste interne**
             — le déboursé vit sur le poste (AC-1), et un lot ne peut pas être imputé sans casser
             AC-9. Créé à la première imputation non rattachée, jamais à la conversion.
             Décidé seul : l'avancement d'un **parent** est pondéré par le déboursé prévu de ses
             enfants (un lot n'a pas d'unité commune) ; sans prévu il reste à 0 plutôt que de
             moyenner des pourcentages sans poids.
             Décidé seul : `margePercent` est **null** sur un nœud interne (vendu nul) — afficher
             « 0 % » sur l'installation de chantier serait un mensonge (AC-12).
             Reste : contrôleurs, suppression de l'agrégat, recâblage KPI/summary + web.
24/08 01:50  AC-8 exécuté. Supprimés : `BudgetChantier`, `BudgetLigne`, leurs repositories,
             `BudgetChantierSeedService`, `seed/budget-chantier-seed.json` ; les tables tombent
             dans le SQL v1.2/002. `BudgetChantierService` **recalcule** le DTO par rubrique
             depuis l'arbre et son `upsert` lève `chantiers.budget.agregat_non_stocke`
             (→ 409 via `GlobalExceptionHandler`) : refus explicite, pas 404 muet.
             `ChantierKpiService` recâblé sur `BudgetArbreService` — un seul chemin de calcul.
             `ChantierSummaryReadService` inchangé : il lit le DTO, désormais dérivé.
             Nouveaux contrôleurs `BudgetArbreController` (GET budget-arbre) et
             `CoutReelNoeudController` (GET/POST couts-reels, PUT …/noeud/{posteId}).
             `nb-compile.sh chantiers` → EXIT=0.
24/08 02:10  Tests backend verts : `BudgetArbreServiceTest` 5/5 (rollup, marge interne,
             écart des deux signes, sans avancement, plafond 100 %),
             `ImputationCoutReelServiceTest` 6/6, `BudgetChantierServiceTest` 2/2.
             **Suite chantiers complète : 51/51.** Reste : le web.
24/08 02:20  Web, périmètre arrêté après repérage. Le vocabulaire des rubriques
             (`MATERIAUX`/`MO`/`LOCATION_MATERIEL`/`CARBURANT`/`FRAIS_GENERAUX`/`IMPREVUS`) est
             utilisé **hors** de `chantiers/` : `achats/models`, `catalogue/models`,
             `socle/shell/stock-budget-sync`. Ces modules sont les **émetteurs de coût réel**, que
             le contrat nomme hors périmètre — et une autre session travaille sur `achats/`.
             Je ne les touche pas. `recordConsommation` prend déjà `rubrique: string`, donc rien
             ne casse. Je change : `budget.model.ts` (les 4 + non ventilé, libellés en clair),
             `budget-api.service.ts` (upsert retiré, lecture de l'arbre ajoutée),
             `budget.facade.ts` (plus d'écriture d'agrégat), le dialog de révision qui descend
             d'un niveau (chantier -> nœud) et la page détail.
24/08 02:45  Web livré. `budget.model.ts` : les 4 rubriques + non ventilé, libellés en clair,
             types `BudgetArbre`/`BudgetNoeud`/`CoutReelDraft`, `BudgetRevisionDraft` gagne
             `noeudId`. `budget-api.service.ts` : `upsert` et `chantierBudgetToApiUpsert`
             **supprimés**, ajout de `getArbre`, `saisirDebourse`, `reviserDebourse`,
             `imputerCoutReel`. `budget.facade.ts` : `saveRevision` (écriture d'agrégat) remplacé
             par `reviserNoeud` / `saisirDebourseInterne` / `imputerCoutReel`.
             `reviser-budget-dialog` descend d'un niveau : il prend un **nœud** et affiche
             « Déboursé prévu » (figé) / « Déboursé révisé » (saisi), NON_VENTILE exclu.
             Page détail : lit l'arbre, aplatit les postes, ouvre le dialog sur un nœud.
             `npx tsc -p tsconfig.app.json --noEmit` : **0 erreur réelle** (les 565 TS6059 sont
             du bruit `rootDir` préexistant sur l'arbre platform ; vérifié en injectant une
             fausse erreur, qui remonte bien).
24/08 03:00  Seed lab : `PosteBudgetaireSeedService` pose désormais un déboursé sur les quatre
             rubriques de chaque poste (origine SAISI) — la dette nommée par SEKTOR-161 est
             fermée, l'écran budget n'est pas vide alors que le seed d'agrégat a disparu.
             Compile finale `chantiers etudes` EXIT=0. chantiers 51/51.
             Suite `etudes` : rouge **préexistant** sous le runner à classpath plat (strictness
             Mockito + ressources absentes) — vérifié sur `CapitalisationOuvrageServiceTest`,
             fichier que je n'ai pas touché, qui échoue pareil. Mes trois fichiers etudes
             modifiés passent : 7/7, 9/9, 9/9.
24/08 03:05  Rapport écrit. status → review.
```

## Rapport de livraison

**ce qui a changé** — `chantiers/` : `CoutReelNoeud` + repo, `ImputationCoutReelService`,
`CoutReelCreateDto`, `CoutReelNoeudController` ; `BudgetArbreService` + `BudgetArbreDto` +
`BudgetArbreController` (le rollup) ; `BudgetChantierService` **recalculé** au lieu d'être lu ;
`ChantierKpiService` recâblé ; `PosteBudgetaireSeedService` sème le déboursé ; schéma
`v1.2/002_cout_reel_par_noeud.sql`. **Supprimés** : `BudgetChantier`, `BudgetLigne`, leurs deux
repositories, `BudgetChantierSeedService`, `seed/budget-chantier-seed.json`, et les deux tables.
`web/app/chantiers/budget/` : modèle, service d'API, façade, dialog de révision et page détail.

**critères prouvés** — `nb-compile.sh chantiers etudes` EXIT=0 ·
`npx tsc -p tsconfig.app.json --noEmit` sans erreur réelle · suite chantiers **51/51** :

| AC | Preuve exécutée |
|----|-----------------|
| AC-8 | `BudgetChantierServiceTest.ecritureDunBudgetParRubriqueAuChantier_refusee` (409 `agregat_non_stocke`) · `lectureParRubrique_dériveeDeLArbre` · les tables tombent dans `v1.2/002` · plus aucune classe `BudgetChantier`/`BudgetLigne` dans l'arbre |
| AC-9 | `BudgetArbreServiceTest.rollup_lePosteRemonteAuLotPuisAuChantier` (12 000 au poste = au lot = au chantier, zéro écriture) |
| AC-10 | `ImputationCoutReelServiceTest.imputation_surUnNoeudEtUneRubrique` · `nonVentile_nEstPasUneCibleDImputation` · `noeudDUnAutreChantier_refuse` · le DTO et la table n'ont **aucun** champ d'activité, zone ou quotité |
| AC-11 | `coutSansNoeud_creeFraisDeChantierALaPremiereImputation` (lot + poste internes, sans vendu ni lien devis) · `coutSansNoeud_reutiliseLeNoeudExistant` · `reimputation_surLeBonNoeud` |
| AC-12 | `marge_lInterneMangeLaMargeDuLot` (poste vendu 40 %, interne −2 000 sans pourcentage, lot 4 000) |
| AC-13 | `ceQuiEstFait_ecartNegatifQuandOnDepassePlusQueLonProduit` (écart −1 600 sur un nœud, +1 400 sur l'autre, −200 au lot) · `avancement_plafonneACentPourCent` |
| AC-14 | `sansAvancement_toutResteLisibleEtRienNEchoue` (avancement 0, fait 0, écart −500 lisible) · aucun test du sous-lot ne crée d'activité, de zone ou de quotité |
| AC-15 | Scan des libellés : aucun « valeur acquise / earned value / EVM / WBS / quotité / ventilation analytique / valeur planifiée » dans `web/app/chantiers` ni dans `i18n/erp/chantiers/*.json`. Le champ s'appelle `debourseFaitHt` et se lit « Déboursé prévu de ce qui est fait » ; le dialog affiche « Déboursé prévu » / « Déboursé révisé ». Les rubriques sont dites en clair : matière, main d'œuvre, matériel, sous-traitance. |

**décidé seul** —
1. **« Frais de chantier » est un lot interne `FRAIS` portant un poste interne du même nom.** AC-1
   veut que le déboursé vive sur le poste et qu'un lot soit la somme de ses enfants : imputer un
   lot directement aurait cassé AC-9. Créé à la première imputation non rattachée, jamais à la
   conversion — le contrat voisin exige exactement une ligne par nœud du devis.
2. **L'avancement d'un parent est pondéré par le déboursé prévu de ses enfants.** Un lot n'a pas
   d'unité commune, donc pas de quantité à diviser. Sans prévu nulle part il reste à zéro plutôt
   que de moyenner des pourcentages sans poids — sinon un lot se dirait à moitié fait parce qu'un
   poste à 3 DH est terminé.
3. **Le pourcentage de marge est `null`, pas zéro, sur un nœud interne** (vendu nul). Afficher
   « 0 % » sur l'installation de chantier serait un chiffre faux plutôt qu'une case vide.
4. **L'avancement est plafonné à 100 %.** Au-delà, c'est un avenant — pas un budget qui gonfle.
5. **Le refus d'AC-8 est un 409 explicite** (`chantiers.budget.agregat_non_stocke`) plutôt qu'une
   route supprimée : un appelant qui écrivait là doit apprendre où le geste est parti, et un 404
   ne le lui dit pas.
6. **`NON_VENTILE` n'est pas imputable en réel.** Il décrit un chiffrage prévu qu'on n'a pas su
   décomposer ; une dépense réelle sait toujours ce qu'elle a payé. Contrainte posée en base.
7. **La révision descend d'un niveau plutôt que de disparaître.** Le dialog existant prend
   désormais un nœud au lieu du chantier : c'est le plus petit geste qui rende AC-7 vrai sans
   inventer un écran que le contrat met hors périmètre.
8. **Les modules émetteurs de coût réel ne sont pas touchés** (`achats/`, `catalogue/`,
   `socle/shell/stock-budget-sync`), qui utilisent encore `MATERIAUX` / `LOCATION_MATERIEL`. Le
   contrat les nomme hors périmètre et une autre session y travaille. `recordConsommation` prend
   déjà `rubrique: string`, donc rien ne casse à la compilation.

**écarts / dette** —
- **`stock-budget-sync` et le drilldown matière alimentent des rubriques qui n'existent plus**
  côté serveur (`MATERIAUX`, `LOCATION_MATERIEL`…). C'est un chemin **local au front**, jamais
  persisté ; il devient inopérant sur les nouvelles rubriques. À reprendre avec
  `matiere-et-magasin` (vague 2), qui est le sous-lot propriétaire.
- **Aucun écran de saisie du déboursé d'un nœud interne** (AC-6) : l'API existe et la façade
  l'expose (`saisirDebourseInterne`), l'écran ne l'appelle pas encore. Même chose pour
  l'imputation d'un coût réel (`imputerCoutReel`) : API et façade prêtes, pas de formulaire.
  C'est de la refonte d'écran, que le contrat met hors périmètre — je le remonte au lieu de
  l'inventer. **SEKTOR-160 ne pourra pas jouer AC-6, AC-10 et AC-11 par l'interface**, seulement
  par l'API.
- **L'engagé reste à zéro** partout (Achats ne l'alimente pas) — hors périmètre nommé.
- **Aucun test de volumétrie sur le rollup** : il est recalculé à chaque lecture, et
  `ChantierKpiService` le fait une fois par chantier actif. Sur un portefeuille large ce sera
  lent. Dette à ouvrir si elle se voit, pas un cache à décider ici.
- **Suite `etudes` rouge sous le runner sans Gradle** (33 échecs) : strictness Mockito et
  ressources absentes du classpath plat. Préexistant — `CapitalisationOuvrageServiceTest`, que je
  n'ai pas touché, échoue de la même façon. Mes trois fichiers `etudes` modifiés passent.
