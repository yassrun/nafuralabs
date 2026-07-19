# Suivi d'avancement

> Mettre à jour à chaque fin de tâche. Ne pas cocher une tâche dont les critères d'acceptation du
> lot ne sont pas vérifiés.

**Dernière mise à jour** : 2026-07-19 — Q1, Q2, Q3, Q6 tranchées ; Q5 investiguée

---

## Chantier préalable — hors epic

| # | Sujet | Statut |
|---|---|---|
| P1 | **Réconcilier les deux arbres front** (Q5). Le build ne compile que `web/app/applications/erp/` ; `products/sektor-btp/web/app/` est du code mort. Les deux ont divergé, chacun avec du contenu unique. Recommandation : fusionner vers `products/` et corriger `tsconfig`. | 🔴 à faire avant le lot 2 |

Tant que P1 n'est pas fait : **tout code front s'écrit dans `web/app/applications/erp/`.**

---

## Vue d'ensemble

Le numéro d'un lot est un identifiant, pas un rang. Ordre d'exécution ci-dessous.

| Rang | Lot | Titre | Statut | Notes |
|---|---|---|---|---|
| 1 | 9 | Référentiel articles et prix | ⬜ à faire | Fondation — `item`, `achats`, résolution de prix |
| 2 | 1 | Fusion du modèle | ⬜ à faire | Bloquant pour la suite |
| 3 | 8 | Suppression des tables `consultation` | ⬜ à faire | Trivialisé par Q6 — plus de migration |
| 4 | 2 | Dossier d'étude + wizard | ⬜ à faire | Précédé de P1 |
| 5 | 3 | Import non destructif | ⬜ à faire | |
| 6 | 4 | Décomposition + bibliothèque | ⬜ à faire | Inclut les ouvrages composites (D9) |
| 7 | 6 | Chiffrage + validation | ⬜ à faire | Débloqué — Q1 et Q2 tranchées |
| 8 | 5 | Branchement sur `achats` | ⬜ à faire | Réécrit — ne crée plus d'entités |
| 9 | 7 | Chaînage aval | ⬜ à faire | Débloqué — Q3 tranchée |
| — | 10 | Ne pas se fermer de portes | ⬜ à faire | 6 règles **transverses** — rien à livrer isolément |

Légende : ⬜ à faire · 🟡 en cours · ✅ terminé · 🔴 bloqué

---

## Jalons

| Jalon | Contenu | Statut |
|---|---|---|
| J0 — Référentiel sain | Lot 9 | ⬜ |
| J1 — Socle sain | + Lots 1 + 8 | ⬜ |
| **J2 — Parcours manuel complet** | + Lots 2, 3, 4, 6 | ⬜ |
| J3 — Prix tracés | + Lot 5 | ⬜ |
| J4 — Chaîne complète | + Lot 7 | ⬜ |
| J5 — Assistance IA | phase suivante | ⬜ |

---

## Questions

| # | Question | Statut |
|---|---|---|
| Q1 | Niveau des FG/marge | ✅ **par article** ; héritage = commodité de saisie |
| Q2 | Marge sur coût ou sur PV | ✅ **sur coût de revient** (déboursé + FG) — formule actuelle correcte |
| Q3 | Ordre chantier / marché | ✅ **marché d'abord**, création atomique, `chantierId` reste NOT NULL |
| Q4 | FG dans le budget chantier | ⬜ ouverte — 🟡 lot 7 |
| Q5 | Doublon front | 🔴 **investiguée** — décision d'option requise (voir P1) |
| Q6 | Valeur des données existantes | ✅ **aucune** — suppression, pas de migration |
| Q7 | Correspondance type SERVICE | ✅ sans objet suite à Q6 |
| Q8 | Aléas et coefficient K | ⬜ ouverte — 🟢 hors périmètre |
| Q9 | FG chantier vs FG siège | ⬜ ouverte — 🟢 hors périmètre |
| Q10 | Base de prix : marché ou PMP | ✅ **marché**, paramétrable |
| Q11 | Ouvrage dans ouvrage | ✅ **oui**, déboursé remonté |
| Q12 | Vente d'articles seuls | ✅ capacité conservée, désactivée |
| Q13 | Portée de l'internationalisation | ✅ **Maroc uniquement**, sans verrou de schéma |

---

## Journal des décisions

| Date | Décision | Source |
|---|---|---|
| 2026-07-19 | D1 — Le modèle de données vit dans `etudes`, `consultation` est supprimé | Arbitrage produit |
| 2026-07-19 | D2 — Les quantités de composants sont des rendements par unité d'ouvrage | Sémantique de `ComposantOuvrage.rendement` |
| 2026-07-19 | D3 — Wizard à 5 étapes | Process métier |
| 2026-07-19 | D4 — Bibliothèque alimentée dès le lot 4 | Prérequis à l'IA |
| 2026-07-19 | D9 — Ouvrages composites, on remonte le déboursé | Q11 |
| 2026-07-19 | D10 — Le prix de vente d'un ouvrage est calculé, jamais un tarif stocké | FG/marge varient par affaire |
| 2026-07-19 | D11 — La consultation fournisseurs réutilise `achats` | Doublon évité |
| 2026-07-19 | D12 — Chiffrage au prix du marché, PMP paramétrable | Q10 |
| 2026-07-19 | D13 — Périmètre Maroc, sans verrou de schéma | Q13 |
| 2026-07-19 | D14 — FG et marge par article | Q1 |
| 2026-07-19 | D15 — Marge sur coût de revient — formule inchangée | Q2 |
| 2026-07-19 | D16 — Marché et chantier créés atomiquement | Q3 |
| 2026-07-19 | D17 — Aucune reprise de données `consultation` | Q6 |

---

## Journal d'implémentation

_(à alimenter au fil des lots : date, lot, ce qui a été fait, écarts au spec, décisions prises en
cours de route)_

### 2026-07-19 — conception

- Création de l'epic (15 fichiers).
- **Correction majeure 1** : la première version du lot 5 spécifiait `DemandePrix` /
  `OffreFournisseur` / `OffreLigne` — doublon de ce que `achats` contient déjà. Lot 5 réécrit en
  « branchement ». Règle 0 ajoutée dans `00-INDEX.md`.
- **Correction majeure 2** : les specs désignaient `products/sektor-btp/web/app/` comme cible front,
  en se fiant à `docs/AGENTS.md:183`. Vérification faite, **ce n'est pas ce que le build compile**.
  Corrigé dans `00-INDEX.md` et `02-dossier-etude-wizard.md`.
- Ajout des lots 9 (référentiel) et 10 (règles transverses).
- Q1, Q2, Q3, Q6 tranchées par l'expert métier. Q5 investiguée, décision d'option en attente.
- Lot 8 trivialisé : plus de migration, simple suppression de tables. Le risque le plus élevé de
  l'epic (rendements ambigus non récupérables) disparaît avec.
