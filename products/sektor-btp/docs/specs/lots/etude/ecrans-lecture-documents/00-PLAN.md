---
kind: epic-plan
app: sektor-btp
slug: ecrans-lecture-documents
module: documents
raster_feature: ERP-67
status: draft
language: fr
---

# Écrans — lecture de documents

> Le côté demande. `document-reader` construit le moteur ; cette epic branche les écrans dessus,
> forme par forme, et n'en ouvre une nouvelle que quand un écran la réclame vraiment.

**Objectif** : que chaque écran qui reçoit un document du monde extérieur — liste à reprendre, BL,
facture, offre, pointage — le lise au lieu de le faire ressaisir, avec le même contrat de relecture
partout.
**Périmètre code** : `products/sektor-btp/web/app/shared/extraction-schemas/`,
`products/sektor-btp/web/app/shared/smart-import/handlers/`, et les écrans listés en §2.
**Hors scope** : le moteur lui-même — grille, plan de lecture, cascade, cache, carte des doutes
(→ [`document-reader`](../document-reader/00-PLAN.md)) ; la lecture du CPS
(→ [`chiffrage-assiste-cps`](../chiffrage-assiste-cps/00-PLAN.md)).

---

## 1. Verdict

Sept écrans sont câblés et la moitié ne fait pas ce que son nom annonce : sur la réception BL il n'y
a **aucune création**, on remplit un formulaire. Le mot « import » décrit un des trois modes de
consommation, pas les trois.

Surtout, la demande réelle est ailleurs que là où le câblage s'est arrêté. Les documents qui coûtent
le plus cher en ressaisie chez un client BTP — **facture fournisseur, offre reçue, pointage** — ne
sont branchés nulle part, et deux d'entre eux attendent des capacités que le moteur ne rend pas
encore. D'où l'ordre : ce qui est déjà servi par le moteur d'abord, ce qui attend une vague ensuite.

Bonne nouvelle sur ce point : la facture fournisseur n'a **qu'un seul écran** — côté finance — et le
rapprochement facture ↔ commande ↔ réception **existe déjà** (`MatchingService`, avec tolérance et
blocage de validation). La lecture n'a donc rien à inventer là : elle a juste à l'alimenter.

---

## 2. Constat — l'inventaire

### 2.1 Câblés aujourd'hui

| Écran | Chemin | Forme | Mode de consommation |
|---|---|---|---|
| Clients | `ventes/clients/client-listing` | liste | alimenter — crée, dédoublonne |
| Fournisseurs | `achats/fournisseurs/fournisseur-listing` | liste | alimenter |
| Employés | `rh/employes/employe-listing` | liste | alimenter |
| Articles | `inventory/catalogue/articles/article-listing` | liste | alimenter |
| Ouvrages | `etudes/bibliotheque-prix/ouvrage-listing` | liste | alimenter |
| Lots de chantier | `chantiers/components/chantier-lots-tab` | arbre | construire — deux passes, `parentLotId` |
| Réception BL | `inventory/mouvements/receptions/reception-detail` | tête + lignes | **remplir — `form.patchValue`, aucune création** |

Sept schémas dans `extraction-schemas/`, **six handlers**. L'écart n'est pas un oubli : le BL n'a pas
de handler parce qu'il ne crée rien. C'est la preuve par le code que « import » nomme mal l'ensemble.

### 2.2 Hors `smart-import`, même besoin

| Consommateur | Où | Statut |
|---|---|---|
| Bordereau d'étude | `etudes/dossiers` | chemin propre, déterministe — c'est l'étalon du moteur |
| CPS | `etudes/…/service/cps` | epic dédiée (ERP-64) |
| Atelier `doc-extractor` | `platform/web/features/documents/doc-extractor` | workspace / builder / discovery — n'alimente aucun écran métier |

### 2.3 Ce qui réclame, et ce que ça attend

| Écran | Chemin | Forme | Attend de `document-reader` |
|---|---|---|---|
| **Facture fournisseur** | `finance/factures-fournisseurs` (`ff-listing`, `ff-detail`) | tête + lignes | lecteur d'ancres — vague 2 |
| **Offre fournisseur reçue** | `achats/appels-offres` | tête + lignes | lecteur d'ancres — vague 2 |
| Accusé de commande | `achats/commandes` | tête + lignes | lecteur d'ancres — vague 2 |
| Cautions, ordres de service | `marches/cautions`, `marches/os` | fiche | lecteur d'ancres — vague 2 |
| **Pointage** | `rh/pointage` | matrice | dépivotage — vague 3 |
| **Comparatif fournisseurs** | `achats/appels-offres` | matrice | dépivotage — vague 3 |
| Reprise comptable | `finance/balance`, `finance/plans-comptables` | liste | rien — servi dès la vague 1 |

Non candidats : `ventes/offres`, `etudes/devis` — ce sont des documents que l'application **produit**,
pas qu'elle lit.

### 2.4 La facture fournisseur — vérifié, ce n'est pas un doublon

Les deux dossiers ne portent pas la même chose :

| Dossier | Contenu | Route |
|---|---|---|
| `pages/finance/factures-fournisseurs/` | `ff-listing`, `ff-detail`, `ff.routes` | `/finance/factures-fournisseurs`, dans la nav |
| `pages/achats/factures-fournisseur/` | `ff-api.service.ts`, `ff.mapper.ts` — **aucune page, aucune route** | — |

**Un seul écran, côté finance**, qui consomme un service rangé sous `pages/achats/`. Ce n'est pas une
duplication fonctionnelle : c'est un service mal placé. Il est appelé depuis sept endroits — finance
(détail, listing, virements), `achats/services/matching.service`, `pilotage/cash-flow-projection`,
`rh/paie/etat-1208` — alors qu'un service sous `pages/<domaine>/` n'est censé servir que ses pages.

**Dette, pas bloquant** : à sortir vers un service partagé quand le lot `tête + lignes` touchera cet
écran. Le tracer ici évite qu'un futur lecteur du PLAN reconstruise le faux doublon.

### 2.5 Le rapprochement existe déjà

`MatchingService` (85 lignes, `app/achats/services/`) fait commande ↔ réceptions ↔ facture :
`loadMatchingForFacture`, `computeForBc`, tolérance paramétrable, `blocksInvoiceValidation`.

Conséquence pour cette epic : **la lecture d'une facture n'a pas à résoudre le rapprochement**, elle
a à produire des lignes propres à lui donner. C'est exactement la frontière qu'`document-reader` pose
en sortant le rapprochement de son moteur — sauf qu'ici, le consommateur est déjà écrit.

---

## 3. Cible

### 3.1 Le contrat d'un écran

Inchangé, il fonctionne déjà — c'est ce qui rend la bascule sûre :

```
écran (fichier + définition)
  → plateforme (lecture + validation + relecture)
  → écran (JSON validé)
  → service applicatif ERP, ou patch de formulaire
```

Un écran fournit trois choses et rien d'autre : une `ExtractionDefinition`, un
`<nf-smart-import-trigger>`, et une fonction de consommation. Aucun service de la feature plateforme
ne dépend d'une API ERP — règle de frontière déjà écrite dans `SMART_IMPORT.md`, à tenir.

### 3.2 Les trois modes, et le vocabulaire

| Mode | Écrans | Ce que dit le bouton |
|---|---|---|
| alimenter une liste | clients, fournisseurs, employés, articles, ouvrages, reprise compta | « Importer depuis un fichier » |
| remplir un document | BL, facture, offre, accusé | « Remplir depuis le BL » |
| construire un arbre | lots de chantier, bordereau | « Charger le bordereau » |

**Pas de nom unique dans l'interface.** L'utilisateur n'a pas à apprendre un nom produit ; il doit
reconnaître son geste. Le nom commun n'existe qu'au niveau capability — *lecture de documents* —
parce que c'est le seul énoncé vrai des trois modes. Cf. §5, Q1.

### 3.3 Ce que cette epic ne modélise pas

Le modèle — grille, `ReadingPlan`, cascade, cache, carte des doutes — vit dans
[`document-reader/00-ARCHITECTURE.md`](../document-reader/00-ARCHITECTURE.md). **Aucun
`00-ARCHITECTURE.md` ici** : deux documents sur le même modèle divergent en trois mois.

---

## 4. Lots

| # | Lot | Intent (1 ligne) | Dépend |
|---|-----|------------------|--------|
| 0 | **Forme `liste`** | Basculer les 5 écrans câblés sur le moteur, mesure = lignes créées ; ajouter la reprise comptable | IM lot 4 |
| 1 | **Forme `arbre`** | Lots de chantier + bordereau, mesure = l'étalon des 703 articles | IM lot 4 |
| 2 | **Forme `tête + lignes`** | BL existant + facture + offre reçue + accusé de commande ; sortir `ff-api` de `pages/achats/` au passage (2.4) | IM vague 2 |
| 3 | **Forme `matrice`** | Pointage et comparatif fournisseurs — les deux qui justifient le dépivotage | IM vague 3 |

`IM` = lots de [`document-reader`](../document-reader/00-PLAN.md).

Aucun lot ne peut démarrer avant `IM lot 4` : cette epic est **entièrement en aval** du moteur. C'est
assumé — son travail utile avant ça est le PLAN lui-même, qui dit à `document-reader` quelles formes
sont réellement réclamées et par qui.

Les lots 2 et 3 sont **la justification** des vagues 2 et 3 de `document-reader` — sans eux, ces vagues
n'ont pas de demandeur, et la règle « une forme n'entre que quand un écran la réclame » les interdit.

Les **status / tickets** → [`00-PROGRESS.md`](./00-PROGRESS.md).

---

## 5. Décisions ouvertes

| # | Question | Bloque |
|---|---|---|
| ~~Q1~~ | ~~Le nom~~ — **tranchée le 11/08** : slug et capability = `document-reader`. Nom de marque reporté | — |
| Q2 | Une facture lue alimente-t-elle `MatchingService` **automatiquement**, ou l'utilisateur déclenche-t-il le rapprochement ? | lot 2 |

~~Q — où vit la facture fournisseur~~ : **répondu par le code** (§2.4). Un seul écran, côté finance.
~~Q — le rapprochement est-il dans cette epic~~ : **non** (§2.5). Il existe dans `achats` ; la lecture
l'alimente, elle ne le refait pas.

**Q1 est tranchée** : `document-reader` partout — slug d'epic, `feature:` PM, capability. Les docs
sont renommées ; **le code ne l'est pas encore**. Périmètre mesuré : **38 fichiers** — 16 plateforme,
21 sous `sektor-btp/web/app` (13 écrans, 8 `shared/`), 1 e2e. Ils se renomment **au lot 0 de
`document-reader`**, quand le moteur déménage en plateforme de toute façon. Le faire séparément,
c'est deux passes pour le même résultat.

Le **nom de marque** (affiché à l'utilisateur au moment du compte rendu — « … a lu 186 lignes, 4 à
vérifier ») est reporté. Il n'entre jamais dans le code : les symboles restent `document-reader`,
quelle que soit la marque retenue.

**Q2 n'est pas une question technique** : `MatchingService.blocksInvoiceValidation` peut bloquer une
validation. Déclencher le rapprochement automatiquement à la lecture, c'est présenter un blocage que
l'utilisateur n'a pas demandé, sur un document qu'il vient à peine de déposer.

---

## 6. UX

- **SSOT canvas** : [`ux/`](./ux/) — à produire au lot 2. Les modes `alimenter` et `construire` ont
  déjà leurs composants (`smart-import-data-table`, `smart-import-tree-table`,
  `smart-import-review-dialog`, `smart-import-edit-dialog`) : **recenser avant de dessiner**.
- Le seul écran réellement nouveau est celui du mode `remplir` : que voit l'utilisateur quand la
  lecture pré-remplit un formulaire qu'il était en train de saisir ? Champ par champ, avec quoi
  distingue-t-il ce qu'il a tapé de ce qui a été lu ?
- Libellés de boutons : §3.2. Un nom par geste, pas un nom produit.

---

## 7. Liens Raster

| Rôle | Id |
|------|-----|
| Feature | ERP-67 |
| Moteur | ERP-53 (`document-reader`) |
| Spec / ADR | ce dossier |
| Tasks | — (découpage après Q1 et Q2) |

---

### DoD « PLAN prêt »

- [x] Frontmatter complet (`slug` = nom dossier)
- [x] Objectif = flux mince (brancher des écrans), pas « refaire l'import »
- [x] Inventaire vérifié dans le code (7 câblés, 6 handlers, candidats situés, faux doublon écarté)
- [x] Lots ordonnés, dépendances vers `document-reader` explicites
- [x] Aucun `00-ARCHITECTURE.md` — le modèle reste dans `document-reader`
- [x] `00-PROGRESS.md` créé en parallèle
