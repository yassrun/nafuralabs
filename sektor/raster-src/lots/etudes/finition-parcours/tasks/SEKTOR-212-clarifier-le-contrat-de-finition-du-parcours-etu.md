---
id: SEKTOR-212
status: done-agent
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: me
tags: [etudes, finition, spec]
---

# Clarifier le contrat de finition du parcours Étude-Chantier

> Figer le reste du parcours raffiné : garde-fous avant gain, conversion sans marché, chaîne cliquable, décision Catalogue, IA du dossier. Hors DA / BL / clôture métier.

Contrat : [`../CONTRAT.md`](../CONTRAT.md). Plan : [`../00-PLAN.md`](../00-PLAN.md). UX : [`../ux/finition-parcours-wireframe.canvas.tsx`](../ux/finition-parcours-wireframe.canvas.tsx).

## Étapes

- [x] Cartographier Mode B `DE-0103` / `DV-2026-0060` / `CH-2026-101` (cockpit, DA, BL, `/clore`).
- [x] Écrire le contrat AC-1 à AC-17 et nommer l'hors périmètre opérationnel.
- [x] Découper les tasks 211–219 via le CLI.
- [x] Produire le canvas des états gain / conversion / devis / chantier / catalogue / checklist / IA.

## Preuves attendues

- Contrat, plan et canvas versionnés.
- Une décision ouverte : AC-3 (100 % coûts = BLOCKING) vs dérogation DG.

## Question

Faut-il pouvoir marquer gagné une étude à **100 % de coûts non établis** ?

- **A** — Non. BLOCKING, UI et API refusent (AC-3 gelé). Un WARNING + motif reste possible seulement si une part de déboursé est établie.
- **B** — Oui, pour `owner` / `dg` avec motif obligatoire, comme la marge négative.

Recommandé : **A** — c'est le P1 de la revue ; une dérogation à 100 % reviendrait à ne rien contrôler.

## Journal

```
27/08 21:57  posée
27/08 21:58  status → doing
27/08 22:15  contrat, plan, canvas et tasks 211–219 posés — attente A/B
27/08 22:01  status → done-agent
27/08 22:01  status → done-agent
```

## Rapport de livraison

Revue humaine 27/08 + API Mode B (sans mutation métier hors `/clore` refusé 409).

Le socle tient (montants, lien étude → chantier, filtres, OS). Restent les P1 : gain sans garde-fou, CTA marché vs dialog, formulaire conversion, devis non ouvrable, numéro devis non cliquable, LIBRE sans décision, double pagination, `/etudes` → devis, faux vide portefeuille, 0/0, statut doublé, %, checklist 7/8.

Carte ops : cockpit propose avancement/attachement/situation ; 0 DA ; 0 BC ; `/clore` exige réception définitive. DA/BL/clôture hors lot (vague 2 + réception).

`CompletudeEtudeService` absent de l'arbre malgré SEKTOR-202 `done-me` — SEKTOR-211 doit recoller le moteur consommé par le gain.

Décidé seul : AC-3 = BLOCKING à 100 % (amendable par B) ; SEKTOR-211 = garde-fous malgré le titre d'inbox ; exec après approbation 212.

Écart : `promote` a créé 211 en `feature` + `gate: me` sans `blocked_by` 212. Ne pas lancer Code avant cette approbation.

