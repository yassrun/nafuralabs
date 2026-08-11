---
id: ERP-64
status: todo
context: nafura
kind: feature
priority: P1
assignee: me
gate: me
feature: chiffrage-assiste-cps
tags: [sektor, etudes, cps, ia, chiffrage]
---

# Feature — Chiffrage assisté CPS (le CPS prescrit, la bibliothèque compose)

> Le CPS dit ce qu'il faut réaliser, jamais avec quoi ni en quelle quantité. Séparer les deux,
> et rendre visible lequel des deux manque.
> Epic : `products/sektor-btp/docs/specs/epics/chiffrage-assiste-cps/`

## Pourquoi

La chaîne CPS → composants est câblée et l'architecture est bonne (recherche locale d'abord,
modèle sur 4 sections). Mais la recherche CPS combine code et libellé entier en **AND** — elle ne
remonte presque jamais rien — et quand elle échoue on appelle le modèle quand même, sur le seul
libellé, **sans que rien ne le signale**. Une décomposition adossée à une prescription et une
décomposition devinée sont deux objets différents : l'une est vérifiable dans le document, l'autre
engage un prix sans que personne ne l'ait décidé. Le produit ne les distingue pas.

## Périmètre

Chaîne `etudes` : indexation CPS, recherche de sections, extraction de prescriptions, escalier des
sources, provenance jusqu'à l'écran et au gate de validation d'étude.
Hors scope : moteur d'extraction documentaire (→ ERP-53 `import-magique`), OCR des CPS scannés,
consultation fournisseurs, chaînage aval.

## Frontière avec ERP-53

Le CPS est de forme *blocs multiples* → **vague 3** d'`import-magique`, non planifiée. Cet epic ne
construit donc **aucun** moteur d'extraction et ne monte rien en plateforme : `CpsSectionneur` reste
dans `etudes`, déclaré provisoire, contrat de sortie écrit pour être remplacé le jour venu.
Exception assumée à D2 d'ERP-53 (« l'IA ne lit jamais les données ») : une prescription en prose n'a
pas de grille contre laquelle compiler un plan.

## Lots (à découper en `kind: task`)

| # | Lot | Dépend |
|---|-----|--------|
| 0 | Étalon et instrumentation | — |
| 1 | Rappel CPS (requête, chemin de section, plafond) | 0 |
| 2 | Provenance et gate | 0 |
| 3 | Escalier des sources — brancher `catalogue`, bibliothèque puis catalogue avant IA | 2 |
| 4 | Deux appels séparés (prescriptions / recette) | 1, 3 |
| 5 | Boucle de retour bibliothèque | 3 |

## Bloquant avant découpage du lot 3

**Q1 — quand le rendement de l'ouvrage tenant et celui du `catalog_ouvrage` divergent, lequel gagne
et le chiffreur voit-il l'écart ?** Le référentiel de rendements existe déjà (`catalog_composants`,
édition `2026.1`) : la question n'est pas de le construire mais de dire ce que vaut sa parole face à
celle du client. Aligner sur le catalogue = imposer des rendements qui ne sont pas les siens, et un
rendement faux est un sous-chiffrage qu'il a payé. Aligner toujours sur le tenant = ne jamais lui
signaler qu'il est hors marché. Décision métier, à trancher avec l'associé.

Trois autres questions ouvertes (descriptif verbatim opposable, seuil d'affichage, mutualisation
inter-tenants) : cf. epic §5.

## Critères de validation

- Le taux de sections CPS retrouvées et le taux `matched` / `missing` sont mesurés **avant** tout
  réglage de prompt, sur un jeu de postes réels validés par l'expert métier.
- Chaque composant proposé affiche sa provenance : section CPS citée, ouvrage bibliothèque, ou
  hypothèse. Aucun troisième cas silencieux.
- Une étude ne peut pas être validée avec des postes en hypothèse qu'aucun humain n'a vus.
- `suggereParIa` survit à l'enregistrement (aujourd'hui perdu au rechargement).
- Aucun appel au modèle quand un ouvrage tenant **ou** un `catalog_ouvrage` couvre déjà le poste.
- Aucun deuxième algorithme de rapprochement : `etudes` consomme `RapprochementDeterministeService`,
  le `LIKE` d'`ItemCatalogResolver` disparaît.

## Enfants

_(aucun encore — PLAN à valider, puis découpage)_

## Journal

```
11/08  spec · epic chiffrage-assiste-cps créé (00-PLAN + 00-ARCHITECTURE + 00-PROGRESS)
11/08  revue code chaîne CPS → composants · 4 bloquants constatés (B1–B4)
11/08  constat · module catalogue (L14-L16) implémenté mais etudes n'en dépend pas
       → escalier à 3 sources de recette · Q1 reformulée (arbitrage tenant vs catalogue)
```
