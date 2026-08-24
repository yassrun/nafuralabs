---
id: SEKTOR-150
status: done-me
context: nafura
type: qa
agent_type: qa
priority: P1
assignee: agent
gate: none
---

# Preuves — arbre vendu / interne et conversion

> e2e sektor : une étude GAGNE convertie donne un chantier EN_PREPARATION, arbre copié, aucun marché, nœud interne ajoutable.

## Étapes

- [x] Lire les rapports SEKTOR-147 / 148 / 149, y compris leurs quinze « décidé seul »
- [x] Couvrir AC-1 à AC-6 et AC-16 par lecture de code et grep ciblés
- [x] Rejouer les JUnit du périmètre à la main (nb-test.sh, jamais Gradle)
- [x] Écrire les onze scénarios e2e nommés du contrat sous sektor/e2e/
- [x] Verdict sur SEKTOR-148 (review → done-agent)

## Journal

```
23/08 18:21  posée
23/08 20:52  status → doing
24/08 --:--  QA repris. Rapports 147/148/149 lus (dont les 15 « decide seul »).
             AC-1/2/4 : schema 003_create_chantier_lots.sql — nature NOT NULL + 3 CHECK
             par table (nature connue, origine ssi vendu, interne sans prix de vente).
             AC-3/4 : ChantierLotService + PosteBudgetaireService — create() force INTERNE,
             refuse un vendu demande et refuse tout prix de vente ; copier*Vendu() exige
             l origine. update() ne touche ni nature ni dpgfNoeudId.
             AC-5 : SituationGenerationService L70-74 filtre NatureLigne.VENDU sur les LOTS.
             AC-16 : les 5 cles i18n (natureColumn/Vendu/Interne, origineAction/Introuvable)
             sont presentes dans fr, en ET ar. Vocabulaire : Vendu / Interne, Sold / Internal,
             mabaa / dakhili. Aucun jargon ERP.
             JUnit rejoues a la main (recette nb-test.sh, jamais Gradle) :
               chantiers                  31/31 verts   TEST_EXIT=0
               ChainageAvalAdapterTest     5/5  verts   TEST_EXIT=0
               DossierEtudeChainageAvalTest 9/9 verts   TEST_EXIT=0
             nb-compile.sh chantiers etudes -> EXIT=0 sur les deux.
             Reste : ecrire les 11 scenarios e2e du contrat.
24/08 --:--  e2e ecrits : sektor/e2e/chantiers-arbre-et-conversion.spec.ts, 11 tests
             portant EXACTEMENT les noms de scenario du contrat.
             `playwright test --list` les decouvre tous les 11 ; tsc strict 0 erreur.
             NON EXECUTES : aucun backend ne tourne, rien n est deploye.
             Deux trous nommes (ni l un ni l autre ne casse un AC ecrit) :
              - un SOUS_LOT orphelin est remonte a la racine en silence
                (ChainageAvalAdapter L88) — AC-12 amende ne parle que des POSTES.
              - le DPGF refuse un ARTICLE sans parent : l etude piege d AC-12 se
                fabrique par un ARTICLE sous un ARTICLE.
```

## Rapport de livraison

**Ce qui a été prouvé, et comment.** Aucun backend ne tourne et rien n'est déployé : les
seize `AC-n` sont tenus par de la **compilation**, des **tests JUnit rejoués à la main** et de
la **lecture de code ciblée**. Les onze scénarios e2e du contrat sont **écrits et non exécutés**
— ils attendent un déploiement staging, et rien dans ce rapport ne prétend le contraire.

**Preuves d'ensemble.**
`bash nb-compile.sh chantiers etudes` → `EXIT=0` sur les deux modules.
`bash nb-test.sh chantiers` → **31 tests, 31 verts**, `TEST_EXIT=0`.
`ChainageAvalAdapterTest` → **5/5 verts**, `TEST_EXIT=0`.
`DossierEtudeChainageAvalTest` → **9/9 verts**, `TEST_EXIT=0`.
`npx playwright test --list chantiers-arbre-et-conversion` → **11 tests découverts**, les onze
noms du contrat.
`tsc --strict` sur le spec neuf → **0 erreur**.

**Table `AC-n` → preuve.**

| AC | Preuve exécutée | Verdict |
|----|-----------------|---------|
| **AC-1** | `003_create_chantier_lots.sql` : `nature VARCHAR(20) NOT NULL` + `CHECK (nature IN ('VENDU','INTERNE'))` sur les **deux** tables. `@PrePersist` retombe sur `DEFAUT_SAISIE`. `nature` rendue par `ChantierLotTreeNodeDto` / `ChantierLotTreePosteDto` et par les GET qui sérialisent l'entité (`ChantierLotController.list`, `PosteBudgetaireController.list`). Test `arbreRendLaNatureDeChaqueLigne` vert. | **prouvé** |
| **AC-2** | `copierLotVendu` / `copierPosteVendu` lèvent `chantiers.arbre.vendu_sans_origine` si l'origine manque — tests `copieProduitUn{Lot,Poste}VenduAvecSonOrigine`, `copieRefuseUnVenduSansOrigine` (×2), verts. Jamais réécrit ensuite : **`grep -rn "setNature(\|setDpgfNoeudId("` sur tout `chantiers/src/main/java` → 0 occurrence**, seul le builder les pose. Lien retour résolu par `GET /api/v1/etudes/dpgf/noeuds/{id}/origine`. CHECK SQL `ck_*_origine` : origine ssi vendu. | **prouvé** |
| **AC-3** | `ChantierLotService.create` et `PosteBudgetaireService.create` forcent `NatureLigne.INTERNE` et appellent `refuserVenduParSaisie` → `IllegalArgumentException("chantiers.arbre.vendu_par_saisie_refuse")`. Refus, pas conversion silencieuse. Tests `saisieProduitUn{Lot,Poste}InterneSansOrigine` et `saisieRefuseUnVenduDemandeExplicitement` (×2), verts. `createTree` (import d'arbre) passe par `create` → interne aussi. | **prouvé** |
| **AC-4** | `refuserVenteSurInterne` en **création** et en **édition** (`update`, branche `nature == INTERNE`) → `chantiers.arbre.interne_sans_prix_de_vente`. `persist` force `prixUnitaireHt` / `montantHt` à `null` quand la nature n'est pas vendue. CHECK SQL `ck_*_interne_sans_vente`. La quantité, elle, est conservée. Tests `saisieRefuseUnPrixDeVente` (×2), verts. | **prouvé** |
| **AC-5** | `SituationGenerationService` L70-74 : `.filter(lot -> lot.getNature() == NatureLigne.VENDU)`, et `chantiers.situation.aucune_ligne_vendue` si le balayage est vide. Tests `generateEcarteLesLignesInternes` et `generateRefuseUnChantierSansAucuneLigneVendue`, verts. **Moitié « attachement » : vide par construction** — `AttachementLigne` ne porte que `posteCode`, une chaîne libre ; il n'existe aucune liste de lignes *proposées* à filtrer. Rien d'interne n'y entre parce que rien de l'arbre n'y entre. Dette déjà à l'inbox. | **prouvé (attachement : vacant)** |
| **AC-6** | `create` (ajout interne), `create` avec `parentLotId` (subdivision), `update` (renommage, réordonnancement), `delete` (suppression) — tous exposés et testés (`generatesParentScopedChildCode`, `allowsLotAtMaxDepth`, `createTreePersistsNestedLotsAndPostes`). Aucune de ces routes n'écrit dans l'étude : **`grep -rn "ma.nafura.etudes"` sur `chantiers/src/main/java` → 0**. Le lien retour tient : `update` ne touche ni `nature` ni `dpgfNoeudId` (cf. AC-2, 0 setter). | **prouvé** |
| **AC-7** | `DossierEtudeService.convertir` L585 : `if (status != GAGNE) throw new IllegalStateException("etudes.dossier.convertir_hors_etat")` — message métier, rendu **409** par le contrôleur, pas une 500. Test `convertir_horsEtat_refuse` vert : le port n'est jamais appelé. | **prouvé** |
| **AC-8** | `ChainageAvalAdapter` : `chantierDto.setStatus(Chantier.STATUS_EN_PREPARATION)`. **`grep -n 'setStatus("EN_COURS")'` → 0**. `ChantierSeedService` ne retombe plus sur `EN_COURS`. Test `chantierNaitEnPreparation` vert (le `ChantierCreateDto` capturé porte `EN_PREPARATION`). Le passage `EN_COURS` reste `ChantierService.demarrer`, intouché. | **prouvé** |
| **AC-9** | `CONVERTIE` est terminal : `StatutDossierEtude.TRANSITIONS` lui associe `EnumSet.noneOf(...)`. Le rejeu est traité **avant** le contrôle de statut, sur `lockByIdAndTenantId` (`@Lock(PESSIMISTIC_WRITE)`) : un dossier portant `chantierGenereId` renvoie ce chantier — un seul comportement, l'amendement est respecté à la lettre. Test `convertir_rejoue_renvoieLeChantierDejaCree` vert. Concurrence : tenue par le verrou, prouvée par lecture (les tests du module sont Mockito, sans base). | **prouvé (concurrence : par lecture)** |
| **AC-10** | **`grep -rln "ma.nafura.marches"` sur `etudes/src` → 0 fichier.** `ContratMarcheService` est sorti du constructeur de l'adapter ; `ConversionResult` ne porte plus que `chantierId` ; `marcheId` a disparu de `DossierConversionResultDto`. Tests `aucunMarcheNiIdentifiantDeMarcheEnSortie` et `convertir_appellePortEtPasseConvertie` (`marcheGenereId == null`) verts. « Rien ne se dégrade » : `PilotageMargeService` L61-67 fait `.orElse(null)` puis retombe sur `chantier.montantHt`, sinon zéro — pas de NPE, pas de ligne perdue. | **prouvé** |
| **AC-11** | `ChainageAvalAdapter` copie chaque `LotProjection` une fois : code, désignation, unité, quantité, PU et ordre repris tels quels ; `projeterLots` projette **tous** les nœuds du DPGF (`findByDpgfIdAndTenantIdOrderByOrdreAsc`), sans filtre. Test `copieLesNoeudsDuDevisEnLignesVendues` vert (aucune ligne ne passe par la saisie quand le devis est sain). Fidélité sur un arbre profond réel : e2e `chantier-conversion-copie-fidele`, **écrit, non exécuté**. | **prouvé pour un devis sain ; profondeur réelle attend staging** |
| **AC-12** | Le rattrapage a disparu : **`grep -rn "Lot principal"` sur `etudes/src` + `chantiers/src` → 2 occurrences, toutes deux des commentaires qui expliquent qu'on ne le forge plus** (adapter L37, test L125). `placerPostesOrphelins` s'exécute **avant** tout appel au port : `PostesOrphelinsException` → **422** nommant les postes (`posteId`, `code`, `designation`) et listant les lots disponibles. Rien n'est rattaché par défaut : un poste sans décision arrête tout. Quatre tests verts, dont `convertir_posteOrphelin_arreteAvantTouteCreationEtLeNomme` (l'étude reste `GAGNE`, `chantierGenereId` nul — c'est aussi le scénario d'abandon), `..._placeSurUnLotExistant_aboutit`, `..._placeDansUnLotDAccueilCree_aboutit`, `posteSansLotDAccueilEchoueAuLieuDeForgerUnLotPrincipal`. | **prouvé** |
| **AC-13** | `DossierConvertirDto` porte `chantierCode`, `dateDemarrage`, `dureeMois` — et rien de planning. Le dialogue `conversion-chantier-dialog.component.ts` demande exactement ces trois champs et affiche « Le zonage est facultatif : la conversion aboutit sans qu'aucune zone soit saisie ». **`grep -n "zone\|activite\|quotite"` sur le dialogue → uniquement cette phrase.** Test `convertir_appellePortEtPasseConvertie` capture les trois portés tels quels. | **prouvé** |
| **AC-14** | `POST /api/v1/chantiers` reste ouvert (`ChantierController.create`) sans exiger d'étude. Conséquence directe d'AC-3 : toute ligne saisie est `INTERNE`, sans origine (CHECK SQL `ck_*_origine`). Aucune situation possible : `generate` lève `chantiers.situation.aucune_ligne_vendue` — test `generateRefuseUnChantierSansAucuneLigneVendue` vert. Arbre, budget, journal et documents restent servis par leurs contrôleurs. Parcours complet : e2e `chantier-sans-etude-tout-interne`, **écrit, non exécuté**. | **prouvé côté serveur** |
| **AC-15** | `web/app/chantiers/detail/` n'existe plus. Aucune route, aucun import, aucune traduction : la clé `chantiers.planning.placeholder` est absente des **trois** fichiers de langue (vérifié `fr`, `en`, `ar`). `chantiers.routes.ts` route toujours vers `./chantier-detail/chantier-detail.page`. | **prouvé** |
| **AC-16** | Colonne `nature` dans `treeColumns` de `chantier-lots-tab.component.ts` ; badge `success` / `default` selon `VENDU` / `INTERNE` ; `rowDpgfNoeudId()` n'expose l'action « voir l'origine » que sur une ligne portant un lien retour, donc les seules vendues ; `ouvrirOrigine()` appelle `origineDuPoste` puis navigue vers l'étude. **i18n aux trois langues, vérifiée clé par clé** : `natureColumn` / `natureVendu` / `natureInterne` / `origineAction` / `origineIntrouvable` présentes en `fr` (**Nature / Vendu / Interne**), `en` (**Nature / Sold / Internal**) et `ar` (**الطبيعة / مباع / داخلي**). Vocabulaire simple, aucun jargon ERP. | **prouvé par typage et lecture ; rendu attend staging** |

**Les e2e écrits.** `sektor/e2e/chantiers-arbre-et-conversion.spec.ts` — un fichier, onze
`test(...)` portant **exactement** les noms de scénario du contrat, tous découverts par
`playwright test --list`. Chaque test forge son propre état initial (suffixe unique, aucun
seeder partagé, aucun rejeu qui dépende du précédent), conformément au § « État initial » :
l'étude nominale a **2 lots, 1 sous-lot, 6 postes** dont un sous le sous-lot, avec des unités
et des prix unitaires **tous distincts** — le contrat interdisait des valeurs qui passent
toutes seules ; un mélange de deux lignes se verrait. Aucune activité, aucune zone.

**Ce qui attend un déploiement staging — liste explicite.**
1. **Les onze scénarios e2e**, sans exception. Aucun n'a tourné : rien n'est déployé, aucun
   backend local n'écoute. Le `test.skip` sur `cursor-session` les met en *skipped*, jamais en
   vert — une suite qui passerait « toute seule » sans backend serait un mensonge.
2. **Les trois CHECK SQL par table** (nature connue, origine ssi vendu, interne sans prix de
   vente) : prouvés par lecture du changelog, jamais exercés par une base. À vérifier au re-seed.
3. **La concurrence d'AC-9** : `@Lock(PESSIMISTIC_WRITE)` est lu, pas joué. Les tests du module
   sont Mockito, sans transaction. Le scénario `chantier-conversion-double-refusee` en porte la
   version à deux appels parallèles.
4. **Le rendu d'AC-16** : la colonne Nature, les badges et l'action « voir le poste d'origine »
   n'ont jamais été affichés dans un navigateur. Typage et lecture seulement.
5. **La fidélité d'AC-11 sur un arbre profond réel** : les JUnit couvrent la copie d'un devis à
   un lot. Le sous-lot et le poste à trois niveaux ne sont vérifiés que par l'e2e.
6. **AC-14 de bout en bout** (journal, documents, budget d'un chantier de régie) : les routes
   existent, le parcours n'a pas été joué.

**Ce que je n'ai pas contourné — deux trous nommés.**
1. **Un `SOUS_LOT` orphelin est remonté à la racine, en silence.** `ChainageAvalAdapter` ne pose
   `parentLotId` que si le `parentCode` figure déjà dans `lotIdByCode` ; sinon le sous-lot naît
   racine, sans que personne ne le voie — et `placerPostesOrphelins` ne regarde que les
   `ARTICLE`. **Ce n'est pas un `AC-n` faux** : AC-12, tel qu'amendé par l'approbateur, ne nomme
   que les **postes**, et AC-11 parle d'un devis validé bien formé. C'est le **contrat** qui ne
   couvre pas ce cas — je ne le réécris pas, je le signale. Noté à l'inbox.
2. **L'étude piège d'AC-12 n'est pas fabricable « proprement » par l'API.**
   `DpgfService.validateTypeParent` **refuse** un `ARTICLE` sans parent (« ARTICLE nodes require
   a SOUS_LOT parent ») mais **accepte** un `ARTICLE` sous un `ARTICLE` — côté conversion, c'est
   le même orphelin. Les deux e2e d'AC-12 passent par cette porte et le disent en commentaire.
   Si la validation se resserre, ces scénarios perdront leur jeu de données. Noté à l'inbox.

**Verdict sur SEKTOR-148.** `review` → **`done-agent`** (gate `none`, donc `done-me`).
Ses sept critères (AC-7 à AC-13) tiennent : 14 tests verts sur les deux classes du périmètre,
zéro import `ma.nafura.marches` dans `etudes`, zéro `setStatus("EN_COURS")`, zéro « Lot
principal » forgé, et un placement des orphelins qui s'exécute avant le moindre appel au port.
Aucun AC cassé. Les deux dettes qu'il déclarait (`build.gradle` qui garde `:sektor:marches`,
concurrence non testée) sont réelles et hors AC — elles restent à l'inbox.

**Ce que je n'ai pas fait.** Aucun code corrigé, aucun critère réécrit, aucun commit.
