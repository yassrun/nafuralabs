---
kind: epic-plan
app: sektor-btp
slug: chiffrage-assiste-cps
module: etudes
pm_feature: ERP-64
status: draft
language: fr
---

# Chiffrage assisté — le CPS prescrit, la bibliothèque compose

> Le CPS dit ce qu'il faut réaliser ; il ne dit jamais avec quoi ni en quelle quantité.
> Séparer les deux, et rendre visible lequel des deux manque.

**Objectif** : qu'un chiffreur ouvre un poste et obtienne une décomposition dont il sait
**d'où elle vient** — prescription CPS citée, ouvrage bibliothèque, ou hypothèse — et que
l'étude ne parte pas en soumission avec des hypothèses non vues.
**Périmètre code** : `products/sektor-btp/backend/modules/etudes/…/service/cps/`,
`…/service/DecompositionProposeService.java`, `…/service/port/`,
`products/sektor-btp/backend/app/…/erp/etudes/DocExtractor*Adapter.java`,
`products/sektor-btp/web/app/pages/etudes/dossiers/components/poste-decomposition-panel/`.
**Hors scope** : le moteur d'extraction documentaire (→ [`import-magique`](../import-magique/00-PLAN.md)),
l'OCR des CPS scannés, la consultation fournisseurs, le chaînage aval.

---

## 1. Verdict

La chaîne est câblée de bout en bout et l'architecture est la bonne — recherche locale d'abord,
modèle sur quatre sections seulement. Mais elle repose sur trois maillons dont **aucun n'est
mesuré**, et le premier ne remonte probablement presque jamais rien : la recherche CPS combine le
code et le libellé entier en **AND** (`websearch_to_tsquery`), donc une section doit contenir tous
les lexèmes d'un libellé de quinze mots. Quand elle échoue, on appelle le modèle quand même, sur le
seul libellé du poste — et **rien ne le dit à l'utilisateur**.

C'est là le vrai sujet. Une décomposition adossée à une prescription et une décomposition devinée
sur un libellé sont deux objets de nature différente : l'une est vérifiable dans le document, l'autre
engage l'entreprise sur un prix sans que personne ne l'ait décidé. Le produit ne les distingue pas.

L'ordre des lots découle d'une contrainte : contrairement au bordereau, **ce périmètre n'a aucun
étalon chiffré**. Tant qu'il n'existe pas, tout réglage de prompt est de la superstition — donc le
lot 0 le construit, avant toute autre chose.

---

## 2. Constat

### 2.1 La chaîne réelle

```
upload CPS  →  ExtracteurTextePdf  →  CpsSectionneur  →  cps_sections + tsvector
poste       →  rechercherPourArticle (top 4)  →  Gemini  →  résolution catalogue  →  matched / missing
```

Deux points d'entrée modèle, tous deux via `StatelessExtractionService`, prompt passé en `text/plain` :
`DocExtractorDescriptifCpsAdapter` (descriptif verbatim) et `DocExtractorDecompositionNeedsAdapter`
(composants + rendements). Aucun n'est persisté.

### 2.2 Bloquants

| # | Fait | Où |
|---|---|---|
| **B1** | `websearch_to_tsquery` combine les mots en **AND** ; la requête est `code + libellé entier`. Le repli ligne 154 rejoue le libellé seul **avec le même opérateur** — il échoue pour la même raison | `CpsSectionRepository:36`, `CpsService:137` |
| **B2** | Zéro section trouvée ⇒ le modèle est appelé quand même avec `Sections CPS candidates : (aucune)`. Aucun champ du DTO ne le signale, aucun badge UI | `DecompositionProposeService:80-88` |
| **B3** | Le pont IA → catalogue est un `LIKE %terme entier%` : « Ciment CPJ 45 » ne matche jamais « CIMENT CPJ45 SAC 50KG ». Tout tombe en `missing` | `ItemCatalogResolver:39` |
| **B4** | `MATCH_SCORE_MIN = 0.5` alors que le score plancher du resolver **est** `0.5` → le filtre ne filtre rien. Et les candidats ne sont pas triés : on retient le premier qui a un prix, pas le meilleur | `DecompositionProposeService:144`, `ItemCatalogResolver:56` |

### 2.3 Dettes

- `suggereParIa` n'existe **pas** dans le DTO d'écriture (`toComposantDpuWrite`) : la traçabilité
  « ce composant vient de l'IA » est perdue au rechargement de la page.
- `BibliothequeDecompositionSuggestionPort` (déterministe, ouvrages déjà validés) est un chemin
  **séparé** du chemin Gemini : on paie un appel même quand l'entreprise possède déjà l'ouvrage.
- **`etudes` ne dépend pas de `catalogue`** (`build.gradle` : `item`, framework, authorization,
  doc-manager — rien d'autre ; zéro import `ma.nafura.catalogue`). Le catalogue Sektor est pourtant
  implémenté (L14–L16) avec ses `catalog_ouvrages` / `catalog_composants` porteurs de **rendements**,
  sa gouvernance ≥ 3 tenants, et un `RapprochementDeterministeService` trigram + règles + LLM. Le
  chiffrage ne le lit jamais, et réimplémente à côté un rapprochement naïf (B3). Seule trace de
  branchement prévu : la permission `catalogue.read` posée sur `BTP_INGENIEUR` en L15.
- `raison("absent_ou_non_tarifé")` confond « item inexistant » (→ créer) et « item sans prix »
  (→ tarifer). Deux gestes utilisateur différents.
- `CpsSectionneur` produit `{numero, titre, contenu, ordre}` — **sans parent ni chemin** : une section
  perd son chapitre, donc on ne sait pas si elle parle de fourniture, de mise en œuvre ou de contrôle.
- Aucun plafond de taille sur le contenu d'une section : une section de trente pages part entière au
  modèle, quatre fois.
- `confiance` est auto-déclarée par le modèle, donc non calibrée — inutilisable comme seuil.
- Rien n'est mémorisé : le chiffreur peut corriger le même rendement à chaque dossier, la proposition
  suivante sera identique.

### 2.4 Le problème conceptuel

Un seul appel fait deux choses de nature opposée :

| | Nature | Vérifiable ? |
|---|---|---|
| lire le CPS | classe B25/B35, dosage, ferraillage prescrit, coffrage | oui — dans le document |
| composer l'ouvrage | quels composants, quels rendements | **non** — ça n'est pas dans le CPS |

Le second est du savoir métier que le modèle produit de façon plausible et invérifiable. Mélangés,
on ne peut plus dire d'où vient une valeur. C'est ce qui rend le résultat inauditable — et donc
inutilisable sur un devis engageant.

---

## 3. Cible

### 3.1 Le principe

```
le CPS prescrit  ·  la bibliothèque compose  ·  l'IA fait le pont
```

Le modèle ne produit plus une décomposition. Il produit **des prescriptions ancrées** (chaque valeur
porte sa section source), puis **choisit une recette** parmi celles qui existent. Le reste est
déterministe.

### 3.2 L'escalier des sources

**Trois sources de recette, une seule d'interprétation.** Les deux référentiels existent déjà :
`ouvrages` (tenant) et `catalog_ouvrages` (produit, module `catalogue`, édition datée). Le CPS
n'apporte pas de recette — il apporte les **paramètres** qui adaptent celle qu'on a choisie.

| Niveau | Condition | Comportement | Ce que voit le chiffreur |
|---|---|---|---|
| 1 | ouvrage **tenant** proche | recette de l'entreprise, **zéro appel** | `Bibliothèque — <ouvrage>` |
| 2 | sinon, ouvrage **catalogue Sektor** proche | recette produit, **zéro appel** | `Catalogue 2026.1 — <ouvrage>` |
| 3 | prescription CPS trouvée | paramètre la recette retenue (classe, dosage, ferraillage) | `CPS §3.2.1` — cliquable vers la section |
| 4 | aucune recette, aucune section | modèle sur libellé seul, confiance plafonnée | `Hypothèse — hors CPS` |
| 5 | poste non décomposable | sortie explicite du modèle | `À chiffrer manuellement` |

Un ouvrage tenant bat un ouvrage catalogue : l'entreprise connaît ses propres rendements mieux que
le produit. Ce qui reste à trancher est la **divergence visible** entre les deux — cf. Q1.

Le niveau 5 n'est aujourd'hui pas exprimable : le prompt dit « renvoie une liste vide », que le front
affiche `Aucun composant détecté` — le même message qu'un échec technique.

Le niveau 4 ne bloque pas la saisie. Il bloque la **validation de l'étude** tant qu'un humain ne l'a
pas vu : c'est le seul endroit où le coût d'une hypothèse fausse se matérialise.

### 3.3 Frontière avec `import-magique`

Les deux epics touchent « un document + un modèle », et c'est là que le doublon se paierait.

| | `import-magique` | cet epic |
|---|---|---|
| Objet | documents **tabulaires** — la grille est le pivot | CPS en **prose** — pas de grille |
| Rôle du modèle | compile un plan de lecture, **ne lit jamais les données** (D2) | lit les données — exception assumée, cf. `00-ARCHITECTURE.md` D7 |
| Sortie | json typé + carte des doutes | prescriptions ancrées + recette |
| Étalon | 703 articles / 4 fichiers | **à construire** — lot 0 |

Le CPS est classé forme *blocs multiples* → **vague 3** d'`import-magique`, c'est-à-dire non planifié.
Conséquence directe : **cet epic ne construit aucun moteur d'extraction et ne monte rien en
plateforme.** `CpsSectionneur` reste dans `etudes`, déclaré provisoire, et son contrat de sortie est
écrit pour être remplacé par la plateforme le jour où la vague 3 arrive — un remplacement
d'implémentation, pas une migration.

Détail du modèle : [`00-ARCHITECTURE.md`](./00-ARCHITECTURE.md).

---

## 4. Lots

| # | Lot | Intent (1 ligne) | Dépend |
|---|-----|------------------|--------|
| 0 | **Étalon et instrumentation** | Un jeu de postes réels décomposés par l'expert métier + les trois compteurs (sections trouvées, matched/missing, écart de rendement) | — |
| 1 | **Rappel CPS** | Corriger la requête (B1), donner un chemin aux sections, plafonner leur taille, garder l'indexation rejouable | 0 |
| 2 | **Provenance et gate** | `sourceProposition` + `sectionsUtilisees[]` au DTO, `suggereParIa` persisté, badges UI, gate de validation d'étude sur les hypothèses non vues | 0 |
| 3 | **Escalier des sources** | Brancher `etudes` sur `catalogue` ; bibliothèque tenant puis catalogue Sektor avant l'IA ; **réutiliser** `RapprochementDeterministeService` au lieu du `LIKE` maison (B3, B4) | 2 |
| 4 | **Deux appels séparés** | Appel 1 = prescriptions ancrées ; étape 2 = recette paramétrée ; choix d'item en liste fermée | 1, 3 |
| 5 | **Boucle de retour** | Verser une décomposition validée en ouvrage bibliothèque — la bibliothèque grossit, l'IA n'est plus sollicitée que pour du neuf | 3 |

Le lot 0 d'abord, sans exception. Les lots 1 et 2 sont des corrections à faible diff et fort effet ;
le lot 4 est la refonte conceptuelle et ne doit pas être tenté avant d'avoir de quoi la mesurer.

Les **status / tickets** → [`00-PROGRESS.md`](./00-PROGRESS.md).

---

## 5. Décisions ouvertes

Décisions actées D1–D10 : [`00-ARCHITECTURE.md`](./00-ARCHITECTURE.md) §7.

| # | Question | Bloque |
|---|---|---|
| **Q1** | Quand le rendement de l'ouvrage tenant et celui du `catalog_ouvrage` divergent : lequel gagne, et le chiffreur voit-il l'écart ? | 🔴 lot 3 |
| Q2 | Un descriptif proposé depuis le CPS et accepté est-il **verbatim opposable** (le prompt l'impose aujourd'hui) ou reformulable ? | lot 2 |
| Q3 | En dessous de quelle confiance n'affiche-t-on **rien** plutôt qu'une proposition faible ? | lot 3 |
| Q4 | Une décomposition validée chez un tenant peut-elle nourrir la bibliothèque d'un autre tenant ? | avant 1er client |

**Q1 est bloquante** parce qu'elle n'est pas technique. Le référentiel de rendements existe déjà
(`catalog_composants`, édition `2026.1`) : la question n'est pas de le construire mais de dire ce que
vaut sa parole face à celle du client. Aligner par défaut sur le catalogue, c'est imposer à une
entreprise des rendements qui ne sont pas les siens — et un rendement faux est un sous-chiffrage
qu'elle a payé. Aligner toujours sur le tenant, c'est ne jamais lui signaler qu'il est hors marché.
Même famille que « catalogue = produit vendable » — à trancher avec l'associé, pas en code.

Q4 est la sœur de O1 d'`import-magique` (portée du cache de plans) et de la clause CGU du catalogue :
à poser avant le premier client réel, pas après.

---

## 6. UX

- **SSOT canvas** : [`ux/`](./ux/) — à produire au lot 2. Deux objets à dessiner et un seul à ne pas
  rater : le **badge de provenance** sur chaque composant, et l'écran des postes en hypothèse au
  moment de valider l'étude.
- Ne pas fusionner « proposé par l'IA » et « hors CPS » en un seul indicateur — ce sont deux
  informations indépendantes (même raisonnement que D9 d'`import-magique` sur les deux natures de
  doutes).
- Existant à recenser avant de dessiner : `poste-decomposition-panel`, `cps-descriptif-dialog`,
  `create-missing-item-dialog`.

---

## 7. Liens PM

| Rôle | Id |
|------|-----|
| Feature | ERP-64 |
| Spec / ADR | ce dossier |
| Tasks | — (découpage après validation du PLAN et de Q1) |

---

### DoD « PLAN prêt »

- [x] Frontmatter complet (`slug` = nom dossier)
- [x] Objectif = flux mince (provenance + escalier), pas « refonte du chiffrage »
- [x] Lots ordonnés (0 → 5), étalon en premier
- [x] Décisions actées et questions ouvertes liées
- [x] Frontière avec `import-magique` écrite
- [x] `00-PROGRESS.md` créé en parallèle
