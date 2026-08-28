---
id: SEKTOR-225
status: done-me
context: nafura
type: feature
agent_type: exec
priority: P1
assignee: agent
gate: none
blocked_by: [SEKTOR-220]
tags: [marches, chantiers]
---

# Notifier le marche depuis le chantier sans le creer a la conversion

> Après conversion, pas de marché. Un geste Notifier crée et notifie. La vente active bascule. Sans notification, le devis reste la vente.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-12.

## Étapes

- [x] Conversion : `marcheGenereId` nul (déjà gelé, à ne pas régresser).
- [x] CTA cockpit / Marchés prérempli chantier : référence, cautions, délais, notifier.
- [x] Après notification : vente active = marché sur fiche et cockpit.

## Preuves attendues

- `alqods-marche-notification` : avant / après, mêmes montants, source changée.
- Chantier jamais notifié : source devis.

## Journal

```
27/08 22:43  posée
28/08 01:59  status → doing
28/08 02:10  status → review
28/08 02:11  status → review
28/08 10:17  status → done-agent · gate none → done-me
```

## Rapport de livraison

**Changé.** Conversion toujours sans `ContratMarche` / `marcheGenereId`. CTA cockpit `notifierMarche` (conducteur / directeur / DG, pas chef ni DAF) tant que `sourceVente ≠ MARCHE`, route `/marches/contrats/new?chantierId=`. Formulaire Marchés : référence, RG, avance, délai, **Créer et notifier** ; plus de défaut premier chantier. `POST …/notifier` bascule `sourceVente` DEVIS → MARCHE via `ChantierVentePort`. Cockpit KPI source et fiche suivent. CTA études « Créer chantier et marché » laissé à SEKTOR-213.

**Preuve.** `node sektor/e2e/scripts/verify-alqods-marche-notification-225.mjs` → **PASS**. `alqods-marche-notification` : mêmes montants, source changée. Chantier non notifié reste DEVIS. Chef sans CTA. Tests `CockpitChantierServiceTest`, `ContratMarcheServiceTest`, `ChantierVenteAdapterTest` verts. Front 4200 joignable. Browser MCP absent.

**Décidé seul.** Port dans marches, adapter dans chantiers (même pattern que 222). Bascule uniquement à `notifier()`, pas à la création brouillon. DAF exclu du CTA (221 interdit l’écriture terrain). Montant vente inchangé (snapshot conversion).

**Écarts.** Capture UI 390 à QA. CTA header études encore « Créer chantier et marché » (SEKTOR-213 / finition-parcours, hors périmètre).

