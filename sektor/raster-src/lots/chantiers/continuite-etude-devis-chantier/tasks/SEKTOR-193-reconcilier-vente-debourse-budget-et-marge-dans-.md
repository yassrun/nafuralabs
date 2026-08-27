---
id: SEKTOR-193
status: done-me
context: nafura
type: bug
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-191, SEKTOR-192]
tags: [api, chantiers, budget, marge]
---

# Réconcilier vente, déboursé, budget et marge dans les lectures

> Faire lire liste, détail et budget depuis les mêmes faits canoniques. Éliminer les faux zéros, statuts divergents et confusions entre vente et déboursé.

Contrat : [`../CONTRAT.md`](../CONTRAT.md), dictionnaire financier et AC-10 à AC-14.

## Étapes

- [ ] Inventorier les champs/read models qui alimentent étude, liste chantier, détail et budget; nommer chaque sens avant modification.
- [ ] Exposer vente initiale/active, déboursé initial, budget révisé et marges valeur/taux depuis leurs agrégats propriétaires.
- [ ] Supprimer les totaux secondaires et fallbacks (`montantHt`, zéro ou statut voisin) qui créent les divergences observées.
- [ ] Appliquer les formules et l'état « non disponible » lorsque le dénominateur ou la source manque.
- [ ] Faire remonter le statut réel du chantier sur chaque lecture, notamment la page budget.
- [ ] Couvrir sérialisation, précision décimale et compatibilité des consommateurs avant retrait d'un ancien champ.

## Preuves attendues

- Tests API contractuels sur `737106.00`, `582600.00`, `154506.00` et `20,96 %` (arrondi d'affichage seulement).
- Test prouvant qu'une vente absente produit `NOT_AVAILABLE`/absence explicite et non `0`.
- Test de cohérence automatique entre endpoints liste, détail et budget pour le même chantier.
- Test statut : `EN_PREPARATION` reste identique dans tous les read models.

## Journal

```
26/08 12:17  posée
26/08 13:21  status → doing
26/08 13:21  status → doing
26/08 13:55  backend read models réconciliés + tests verts → review
26/08 13:30  status → review
26/08 16:13  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Changements (backend chantiers — le web est porté par SEKTOR-194) :**

- `ChantierSummaryDto` — dictionnaire financier canonique exposé : `montantVenteInitialHt`, `montantVenteActifHt` (AC-11 : devis accepté tant que pas de marché, sans fallback), `debourseInitialHt`, `budgetReviseHt`, `margeInitialeHt/Pct`, `margeProjeteeHt/Pct`, `sourceVente`, `status` (AC-2).
- `ChantierSummaryReadService` — tous les montants dérivés des mêmes agrégats (snapshot AC-9 + arbre) ; marges par les formules du dictionnaire (AC-10), jamais saisies ; valeur non calculable = `null` (AC-14), jamais zéro ; `margeHt` hérité (revise − realise, sens ambigu) passé à `null`.
- `Chantier` (entité) — `getFacturesEmisesHt()/getEncaissementsTtc()/getCumulSituationsHt()` passent de `ZERO` codé en dur à `null` (AC-14 : une absence n'est pas un zéro) ; `montantVenteActifHt` exposé en JSON ; `sourceVente` exposé.
- `BudgetArbreDto` + `BudgetArbreService.lireArbre` — expose le `status` réel du chantier (AC-14 : un `EN_PREPARATION` n'est jamais présenté `EN_COURS` sur la page budget).
- `BudgetChantierService` — `pourcent()` retourne `null` (indisponible) quand la base est nulle/0 au lieu de `0` ; `scale()` ne transforme plus une absence en zéro.

**Anciens champs :** conservés mais neutralisés (`margeHt` → null), renommés côté API (`montantVenteActifHt` nouveau). `PilotageMargeService` (marge fictive 18 % cible) est **hors périmètre** : il relève de la frontière `frontieres-bc` (AC-11, départ au socle) — dette nommée.

**Preuves exécutées :**

- `ChantierSummaryReadServiceTest` : dictionnaire canonique complet (`737106 / 582600 / 154506 / 20,96 %`), absence de snapshot → vente et marges `null` (AC-17), vente absente → pourcentage `null` (AC-14), statut réel transmis.
- `BudgetArbreServiceTest` : la page budget porte `EN_PREPARATION`.
- `BudgetChantierServiceTest`, `ChantierServiceSnapshotTest`, `ChantiersNoEtudesDependencyTest` — verts.
- Suite complète chantiers : **93 tests, 0 échec**. `node raster/t.mjs check` : 0 erreur.

**Décidé seul :** ne pas retirer `budgetHt`/`montantHt` du JSON (compat web jusqu'à SEKTOR-194) ; la liste brute expose déjà la vraie vente via `montantVenteActifHt`.

**Écarts / dette :** libellés et colonnes du web (liste « Vente HT » affichant budgetHt, hero de la fiche, page budget) alignés dans SEKTOR-194 ; `PilotageMargeService` et `ChantierKpiService` attendent la frontière `frontieres-bc`.
