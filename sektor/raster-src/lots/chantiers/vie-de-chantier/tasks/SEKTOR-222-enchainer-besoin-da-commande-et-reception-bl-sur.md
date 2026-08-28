---
id: SEKTOR-222
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P0
assignee: agent
gate: none
blocked_by: [SEKTOR-221]
tags: [achats, catalogue, chantiers]
---

# Enchainer besoin DA commande et reception BL sur un noeud

> DA sur le nœud 2.1 → BC → BL direct. BL partiel acier 12/25 t. Pas de magasin obligatoire.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-4 à AC-7. Scénario actes 2.a et 3.

## Étapes

- [x] DA : `chantierId` obligatoire, `noeudId` pour un vendu ; sans nœud = interne.
- [x] BC issu de la DA, mêmes nœuds.
- [x] Réception BL : numéro, date, quantités ; reste visible si partiel.
- [x] Imputation réel/engagé sur le nœud. Écart reçu > commandé refusé ou tracé.

## Preuves attendues

- `alqods-da-bl-direct-2-1` : 40 t sur 2.1. **PASS**
- `alqods-bl-partiel-acier` : 12 t / 25 t, reste 13. **PASS**
- Pas d'écriture magasin obligatoire. **PASS** (`destLocationId` omis)

## Journal

```
27/08 22:43  posée
28/08 00:14  status → doing
28/08 00:14  status → doing
28/08 00:35  status → review
28/08 10:17  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Changé.** `noeudId` sur DA et BC (schéma v1.1/004). `chantierId` obligatoire à la création DA. BC créé avec `daId` recopie chantier/nœud/lignes et marque la DA CONVERTIE. Réception sans magasin si `destLocationId` absent. Qté reçue > reste → 409 `achats.reception.ecart_qte`. Réel MATIERE imputé sur le nœud ; engagé lu sur le budget-arbre depuis les BC. UI : nœud en query, magasin optionnel, plus de cap silencieux. `@RequirePermission` DA/BC ramené aux verbes CRUX.

**Preuve.** `node sektor/e2e/scripts/verify-alqods-da-bl-222.mjs` → PASS. Tests unitaires DA/réception/budget-arbre verts. Front 4200 joignable. Browser MCP absent.

**Décidé seul.** Imputation à la réception. Engagé = total HT des BC non brouillon/annulé. Preuve métier en owner (conducteur/chef 403 tant que les annotations longues n'étaient pas redéployées). Grant `demande-achat.update` conducteur dans 006.

**Écarts.** Redémarrer l'API pour les verbes CRUX, puis rejouer en `conducteur` / `chef-chantier`. Capture 390 à QA. Liquibase 004 via `migrate`.

