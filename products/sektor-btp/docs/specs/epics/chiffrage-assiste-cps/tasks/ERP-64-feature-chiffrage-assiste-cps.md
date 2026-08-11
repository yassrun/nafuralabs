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
Hors scope : moteur d'extraction documentaire (→ ERP-53 `document-reader`), OCR des CPS scannés,
consultation fournisseurs, chaînage aval.

## Frontière avec ERP-53

Le CPS est de forme *blocs multiples* → **vague 3** de `document-reader`, non planifiée. Cet epic ne
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

## Décision produit actée (11/08)

**La recette tenant calcule ; l'écart avec le catalogue s'affiche.** Aligner par défaut sur le
catalogue imposerait à une entreprise des rendements qui ne sont pas les siens ; ne rien afficher ne
lui dirait jamais qu'elle est hors marché. Le chiffreur décide, informé.

Conséquence structurelle : le `catalog_ouvrage` est rapproché **même quand le tenant gagne** — il a
deux rôles, source de repli et comparateur. Coût nul, le rapprochement est déterministe.
Détail : epic `00-ARCHITECTURE.md` D11.

**Granularité de l'écart (D12)** : une seule ligne au niveau du déboursé de l'ouvrage, au-delà d'un
seuil ; le détail par composant à la demande. Douze badges de rendement ne se lisent pas.

Reste ouvert (non bloquant) : descriptif verbatim opposable (Q2), **valeurs** des deux seuils — à
lire sur l'étalon du lot 0, pas à décider a priori (Q3), mutualisation inter-tenants (Q4).

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
- Un poste chiffré depuis un ouvrage tenant affiche son écart avec le `catalog_ouvrage` rapproché,
  et l'étude retient l'édition catalogue sur laquelle elle s'est comparée (D11).
- L'écart apparaît **une fois par poste**, jamais composant par composant par défaut (D12), et les
  seuils sont justifiés par la distribution mesurée au lot 0.

## Enfants

_(aucun encore — PLAN à valider, puis découpage)_

## Journal

```
11/08  spec · epic chiffrage-assiste-cps créé (00-PLAN + 00-ARCHITECTURE + 00-PROGRESS)
11/08  revue code chaîne CPS → composants · 4 bloquants constatés (B1–B4)
11/08  constat · module catalogue (L14-L16) implémenté mais etudes n'en dépend pas
       → escalier à 3 sources de recette · Q1 reformulée (arbitrage tenant vs catalogue)
11/08  décision · Q1 tranchée → D11 : recette tenant calcule, écart catalogue affiché
       → catalog_ouvrage rapproché même quand le tenant gagne · lot 3 débloqué
11/08  décision · D12 : un seul écart au niveau du déboursé, détail composant à la demande
       → Q3 réduite aux valeurs de seuil, calibrées sur l'étalon du lot 0
```
