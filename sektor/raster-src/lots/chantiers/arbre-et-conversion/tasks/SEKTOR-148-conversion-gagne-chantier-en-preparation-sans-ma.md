---
id: SEKTOR-148
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
---

# Conversion GAGNE — chantier EN_PREPARATION, sans marché

> ChainageAvalAdapter : retirer setStatus(EN_COURS) et la création du ContratMarche. Le marché naît à la notification, pas ici. Étude passe CONVERTIE.

## Étapes

- [x] `ChainageAvalAdapter` : chantier créé `EN_PREPARATION`, plus jamais `EN_COURS` (AC-8)
- [x] `ChainageAvalAdapter` : suppression du `ContratMarche` ; `ConversionResult` ne rend plus qu'un chantier (AC-10)
- [x] `ChainageAvalAdapter` : suppression du fallback « premier lot trouvé / Lot principal » (AC-12)
- [x] `DossierEtudeService.convertir` : rejeu → renvoie le chantier existant ; verrou pessimiste (AC-9) ; refus hors `GAGNE` (AC-7)
- [x] `placerPostesOrphelins` : détection, refus nominatif avant toute création, placement explicite, lot d'accueil interne (AC-12)
- [x] `DossierConvertirDto` + `PlacementPosteOrphelinDto` ; 422 nommant les postes et les lots disponibles
- [x] `ChantierSeedService` : le statut par défaut n'est plus `EN_COURS`
- [x] Web : écran de conversion (code / date / durée, AC-13) et écran de placement des orphelins (AC-12)
- [x] Tests JUnit compilés et exécutés à la main (Gradle HS)

## Journal

```
23/08 18:21  posée
23/08 22:15  status → doing
23/08 22:40  backend : port, adapter, service, DTO, controller. Compile chantiers+etudes EXIT 0.
23/08 23:05  web : deux dialogues de conversion, api service typé, PostesOrphelinsError.
23/08 23:20  tests : 9/9 DossierEtudeChainageAvalTest, 5/5 ChainageAvalAdapterTest, 31/31 chantiers.
23/08 23:30  rapport rempli, status → review.
23/08 20:28  status → review
23/08 21:34  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Ce qui a changé.** `ChainageAvalAdapter` ne fait plus trois choses : il ne pose plus
`EN_COURS` (le chantier est créé `EN_PREPARATION`), il ne crée plus de `ContratMarche` — le
service `ContratMarcheService` sort du constructeur, et plus aucune classe `ma.nafura.marches`
n'est importée par `etudes` —, et il ne rattrape plus un poste sans parent : il lève au lieu de
forger un « Lot principal ». `ChainageAvalPort` suit : `ConversionResult` ne porte plus que
`chantierId`, `ConversionCommand` perd `marcheIntitule`, et `LotProjection` accepte un
`dpgfNoeudId` nul — un lot d'accueil créé par l'humain, qui part alors par `create` (interne)
plutôt que `copierLotVendu`. `DossierEtudeService.convertir` est réordonné : le rejeu est traité
**avant** le contrôle de statut, sur une ligne verrouillée en écriture
(`lockByIdAndTenantId`) ; une nouvelle passe `placerPostesOrphelins` détecte les articles sans
lot parent, applique les décisions de l'humain, et lève `PostesOrphelinsException` — qui nomme
les postes et liste les lots disponibles — avant tout appel au port. Le contrôleur la rend en
422. Côté web : `DossierEtudeApiService.convertir` est typé et traduit ce 422 en
`PostesOrphelinsError` ; deux dialogues neufs (`conversion-chantier-dialog`,
`postes-orphelins-dialog`) remplacent le `confirm()` « Créer chantier et marché ».
`ChantierSeedService` ne retombe plus sur `EN_COURS` faute de statut explicite.

**Critères prouvés.**
`AC-7` → `convertir_horsEtat_refuse` : depuis `DEVIS_GENERE`, `IllegalStateException`
`etudes.dossier.convertir_hors_etat`, et le port n'est jamais appelé.
`AC-8` → `ChainageAvalAdapterTest.chantierNaitEnPreparation` : le `ChantierCreateDto` capturé
porte `EN_PREPARATION` et pas `EN_COURS`.
`AC-9` → `convertir_rejoue_renvoieLeChantierDejaCree` : une étude `CONVERTIE` portant
`chantierGenereId` renvoie ce chantier, reste `CONVERTIE`, et n'appelle pas le port. La
concurrence est tenue par `@Lock(PESSIMISTIC_WRITE)` sur la ligne du dossier — le second appel
attend le premier et retombe sur ce même chemin.
`AC-10` → `convertir_appellePortEtPasseConvertie` vérifie `dossier.marcheGenereId == null` ;
`ChainageAvalAdapterTest.aucunMarcheNiIdentifiantDeMarcheEnSortie` ; et la preuve structurelle :
`grep -rn "ma.nafura.marches" etudes/src` ne rend plus rien.
`AC-11` → inchangé et toujours porté par la copie (`copierLotVendu` / `copierPosteVendu`,
prouvés en SEKTOR-147) ; `ChainageAvalAdapterTest.copieLesNoeudsDuDevisEnLignesVendues` vérifie
qu'aucune ligne ne passe par la saisie quand le devis est sain.
`AC-12` → quatre tests : `convertir_posteOrphelin_arreteAvantTouteCreationEtLeNomme` (le poste
est nommé, le port n'est jamais appelé, l'étude reste `GAGNE`, `chantierGenereId` reste nul —
c'est aussi le scénario d'abandon), `..._placeSurUnLotExistant_aboutit`,
`..._placeDansUnLotDAccueilCree_aboutit` (le lot d'accueil part sans origine),
`ChainageAvalAdapterTest.posteSansLotDAccueilEchoueAuLieuDeForgerUnLotPrincipal`.
`AC-13` → `convertir_appellePortEtPasseConvertie` capture `chantierCode`, `dateDemarrage` et
`dureeMois` portés tels quels ; le dialogue ne demande rien d'autre et ne parle jamais de zone,
d'activité ni de quotité.
Preuve d'ensemble : `nb-compile.sh chantiers etudes` → EXIT 0 ; `nb-test.sh chantiers` → 31/31 ;
`DossierEtudeChainageAvalTest` → 9/9 ; `ChainageAvalAdapterTest` → 5/5 ; `tsc` sur
`app/chantiers` + `app/etudes` → 0 erreur.

**Décidé seul.**
1. **L'ordre AC-9 avant AC-7.** Le contrat veut qu'un rejeu renvoie le chantier, et qu'un statut
autre que `GAGNE` soit refusé — or après conversion le statut *est* `CONVERTIE`. J'ai donc mis
le test « déjà converti » **avant** le test de statut : sans cela AC-9 était inatteignable. Effet
de bord assumé : une étude qui porterait un `chantierGenereId` dans un statut inattendu renverrait
ce chantier au lieu de refuser.
2. **Le lot d'accueil créé par l'humain est INTERNE.** AC-12 autorise à « créer le lot
d'accueil » sans dire sa nature. AC-3 tranche : seule la copie produit du vendu. Le lot part donc
sans origine, sans prix de vente. **Conséquence à nommer :** la situation de travaux se calcule
aujourd'hui sur les *lots* et non sur les postes ; un poste vendu logé sous un lot d'accueil
interne ne sera donc pas facturé tant que la situation n'est pas refondue. Noté à l'inbox.
3. **Le placement se joue au serveur, pas au client.** Le 422 renvoie les postes **et** la liste
des lots du devis, pour que l'écran n'ait pas à recharger le DPGF ni à deviner les destinations
possibles. Le client rejoue le même appel avec les placements accumulés.
4. **`marcheId` disparaît de `DossierConversionResultDto`.** Le champ serait resté toujours nul.
`DossierEtude.marcheGenereId` est en revanche **conservé** : c'est là que le marché atterrira à
la notification.
5. **Le défaut `EN_COURS` du seeder devient `EN_PREPARATION`.** Aucun effet aujourd'hui — les six
chantiers du jeu de démo portent tous un statut explicite — mais un chantier sans statut n'est
pas un chantier démarré.
6. **Deux dialogues web construits sans canvas.** Le contrat dit « aucun écran neuf ici », mais
AC-12 amendé et AC-13 en exigent un : l'ancien geste était un `confirm()` qui n'envoyait aucun
champ. J'ai fait le minimum crédible, en français, sans clé i18n (l'écran de conversion existant
était déjà en dur). À reprendre si un canvas est écrit.

**Écarts / dette.**
- **Pas de clés i18n pour les deux dialogues** : textes en dur, alignés sur le style de
  `dossier-detail.page.ts` qui l'était déjà (`window.prompt`, libellés français). Un passage i18n
  est à prévoir avec le canvas.
- **`etudes/build.gradle` garde `implementation project(':sektor:marches')`** alors que plus
  aucune classe n'est importée. Ligne non retirée : Gradle ne démarre pas sur cette machine, je
  ne peux pas prouver que la suppression ne casse rien. Notée à l'inbox.
- **Concurrence non testée** : `@Lock(PESSIMISTIC_WRITE)` est prouvé par lecture, pas par un test
  à deux transactions — les tests de ce module sont des tests Mockito sans base.
- **`AttachementLigne` toujours sans lien vers l'arbre** (dette héritée de SEKTOR-147, notée à
  l'inbox).
- **La suite `etudes` complète reste non rejouable hors Gradle** (pdfbox 2 vs 3 dans le cache
  plat, ressources de test absentes du classpath de la recette). Les deux classes du périmètre
  sont vertes ; les 35 échecs restants sont d'environnement et antérieurs.
