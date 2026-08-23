---
id: SEKTOR-147
status: done-me
context: nafura
type: tech
agent_type: exec
priority: P1
assignee: agent
gate: none
---

# Nœud vendu ou interne, avec lien retour vers le poste vendu

> ChantierLot et PosteBudgetaire gagnent une nature (VENDU|INTERNE) et l'id du nœud DPGF d'origine. Un vendu naît de la copie, jamais de la saisie.

## Étapes

- [x] Enum `NatureLigne` (VENDU | INTERNE) + colonnes `nature` / `dpgf_noeud_id` sur `ChantierLot` et `PosteBudgetaire` (entités + schéma v1.0, lab = schéma cible net)
- [x] `ChantierLotService` / `PosteBudgetaireService` : chemin saisie (interne, refus du vendu et du prix de vente) vs chemin copie (`copier…Vendu`, origine obligatoire)
- [x] Seeders `ChantierLotSeedService` / `PosteBudgetaireSeedService` : plus une seule ligne sans nature
- [x] Élargir `ChainageAvalPort.LotProjection` avec l'id du nœud DPGF et brancher la copie dans `ChainageAvalAdapter`
- [x] `SituationGenerationService` : le balayage à facturer ne retient que les lignes vendues
- [x] Web : modèles + formulaires de saisie n'envoient plus de prix de vente sur une ligne interne
- [x] Tests JUnit compilés et exécutés à la main (Gradle HS)

## Journal

```
23/08 18:21  posée
23/08 19:02  status → doing
23/08 21:10  reprise apres coupure — backend chantiers/etudes verifie en place, compile OK.
             Reste : modeles + formulaires web (saisie sans prix de vente), tests JUnit.
23/08 21:40  web : nature + dpgfNoeudId sur LotChantier / PosteBudgetaire, services API
             n'envoient plus de prix de vente en saisie, dialogue de lot idem, import
             manuel idem. tsc app + specs : 0 erreur.
23/08 22:05  JUnit chantiers compiles et joues a la main (recette nb-test.sh, pas Gradle) :
             31/31 verts, dont 11 neufs sur AC-1..AC-5.
23/08 22:10  rapport rempli, status -> done-agent.
23/08 19:59  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Ce qui a changé.** `chantiers/` : enum `NatureLigne`, colonnes `nature` (NOT NULL) et
`dpgf_noeud_id` sur `ChantierLot` et `PosteBudgetaire` (entités + `003_create_chantier_lots.sql`
avec trois CHECK : nature connue, origine ssi vendu, interne sans prix de vente) ; deux chemins
séparés dans `ChantierLotService` / `PosteBudgetaireService` — `create` (saisie, toujours
`INTERNE`, refus explicite du vendu et du prix de vente) et `copierLotVendu` /
`copierPosteVendu` (copie, `VENDU`, origine obligatoire) ; nature et origine rendues par les DTO
d'arbre ; `SituationGenerationService` ne balaie plus que les lignes vendues ; seeders et
`postes-budgetaires-seed.json` repris (tout interne, plus aucun prix). `etudes/` :
`ChainageAvalPort.LotProjection` porte l'id du nœud DPGF, `DossierEtudeService` le projette,
`ChainageAvalAdapter` appelle les deux `copier…Vendu`. Web `app/chantiers/` : `NatureLigne`,
`nature` + `dpgfNoeudId` sur les modèles et les deux services API, aucun prix de vente envoyé
en création, prix envoyé en édition seulement si la ligne est vendue, champ prix retiré du
dialogue de saisie, import manuel de lots (`lot-chantier-import.handler`) ne transmet plus de
prix.

**Critères prouvés.**
`AC-1` → `nature` NOT NULL + CHECK en base, défaut `INTERNE` au `@PrePersist`, rendue par
`ChantierLotTreeNodeDto` / `ChantierLotTreePosteDto` — test `arbreRendLaNatureDeChaqueLigne`.
`AC-2` → `copierLotVendu` / `copierPosteVendu` exigent l'origine — tests
`copieProduitUnLotVenduAvecSonOrigine`, `copieRefuseUnVenduSansOrigine` (idem côté poste) ;
`update` ne réécrit ni `nature` ni `dpgfNoeudId`.
`AC-3` → tests `saisieProduitUnLotInterneSansOrigine`, `saisieRefuseUnVenduDemandeExplicitement`
(message `chantiers.arbre.vendu_par_saisie_refuse`), idem poste.
`AC-4` → tests `saisieRefuseUnPrixDeVente` (message
`chantiers.arbre.interne_sans_prix_de_vente`), CHECK SQL `ck_*_interne_sans_vente`, et côté web
le champ prix n'apparaît plus en saisie.
`AC-5` → tests `generateEcarteLesLignesInternes` (une seule `SituationLigne` sauvée, cumul
12 000 sans la ligne interne) et `generateRefuseUnChantierSansAucuneLigneVendue`.
`AC-6` → `update` et `delete` ne touchent ni nature ni origine ; tests d'édition existants
(`generatesParentScopedChildCode`, `allowsLotAtMaxDepth`, `createTree*`) toujours verts.
Preuve d'ensemble : `nb-compile.sh chantiers etudes` → EXIT 0 sur les deux ; `nb-test.sh
chantiers` → 31 tests, 31 verts ; `tsc` app + specs web → 0 erreur.

**Décidé seul.**
1. **Le refus plutôt que l'ignorance, jusque dans l'import d'arbre.** `createTree` continue de
recopier le prix reçu dans le DTO du poste : il est donc *refusé* par `PosteBudgetaireService`,
pas silencieusement effacé. C'est la lecture littérale d'AC-3 (« pas silencieusement convertie »)
appliquée à AC-4. Conséquence : un ancien client qui postait des prix dans `/lots/tree` reçoit
maintenant une erreur. Le web a été corrigé en conséquence.
2. **Le prix de vente reste éditable sur une ligne vendue.** AC-6 ouvre l'édition de l'arbre sans
dire si un vendu garde un prix modifiable. J'ai gardé la modification possible et n'ai fermé que
le cas interne — le contraire aurait ajouté un interdit qu'aucun `AC-n` ne demande.
3. **Le seed de démonstration devient tout interne, prix compris.** `postes-budgetaires-seed.json`
perdait sinon la contrainte SQL. Les montants du jeu de démo disparaissent donc de l'écran
chantier tant qu'aucune conversion n'a eu lieu. C'est cohérent avec AC-14 (un chantier sans étude
n'a que de l'interne) mais cela change ce que le QA voit à l'ouverture.
4. **`generate` lève désormais `chantiers.situation.aucune_ligne_vendue`** quand un chantier n'a
que de l'interne, là où il levait « No lots found ». Message métier, même type d'exception.

**Écarts / dette.**
- **AC-5, moitié « attachement » non couverte côté serveur** : `AttachementLigne` ne référence
  aucun lot ni poste (`posteCode` est une chaîne libre saisie par l'humain). Il n'existe aucune
  liste de lignes *proposées* à un attachement à filtrer. Rien n'a donc été fait de ce côté ; si
  la refonte de l'attachement lui donne un jour un lien vers l'arbre, le filtre `VENDU` sera à
  poser là.
- **Deux tests `etudes` rouges avant mon passage** :
  `DossierEtudeChainageAvalTest.gagne_horsEtat_refuse` et `.convertir_idempotentSiDejaChantier`
  échouent en `UnnecessaryStubbingException` (stub `repository.save` non lenient). Indépendant de
  ce lot ; le second sera réécrit par SEKTOR-148 (AC-9).
- **Suite `etudes` non rejouable intégralement hors Gradle** : le classpath plat du cache mélange
  pdfbox 2 et 3, et les ressources de test ne sont pas sur le classpath de la recette. 35 échecs
  d'environnement, aucun dans le périmètre de ce lot.
- **Pas de test d'intégration base** : les CHECK SQL ne sont prouvés que par lecture. Le QA les
  vérifiera au re-seed (lab : schéma clean, pas de migration douce).
