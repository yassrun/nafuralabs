# CH-00-INIT — socle

**Type :** `EVOL` (forme `INIT` — première vérité du socle)
**Cible :** socle `nafura-platform`
**Qualification :** le BC `lecture` déclare consommer le tenant et l'isolation ; le socle n'avait pas de contrat.

## Pourquoi

Sans socle, `lecture` recopierait l'isolation dans sa SPEC. La contrainte CADRE « isolation par tenant » n'aurait pas de politique.

## Aujourd'hui

Rien de spécifié. Le code porte un tenant dans le cache de plans.

## Attendu

Un `SPEC.md` socle mince : deux capacités consommées par `lecture`, trois `POL-*`, rôles de cette app seulement, matrice des actions de lecture.

## Critères d'acceptation (gelés)

- **AC-1** Chaque capacité nomme `lecture` comme consommateur.
- **AC-2** `POL-TENANT-ISOLATION` est définie et opposable.
- **AC-3** Aucun rôle métier d'un produit n'apparaît au catalogue.
- **AC-4** La matrice indexe `P-LECTURE-LANCER` et `P-LECTURE-REVOIR` sans recopier une règle de lecture.

## Preuves attendues

Revue du `SPEC.md` contre le CADRE. Preuve d'isolation : scénario e2e du CH lecture (deux tenants, même empreinte, plans distincts).
