---
id: SEKTOR-220
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P0
assignee: agent
gate: me
tags: [sektor]
---

# Scénario réel Al Qods — étude jusqu'à la livraison

> Figer la vie d'une STE palier 1 : scénario directeur, attentes par BC, AC des ops quotidiennes. Études en pause.

Scénario : [`../SCENARIO.md`](../SCENARIO.md). Contrat : [`../CONTRAT.md`](../CONTRAT.md). Plan : [`../00-PLAN.md`](../00-PLAN.md). UX : [`../ux/vie-de-chantier-wireframe.canvas.tsx`](../ux/vie-de-chantier-wireframe.canvas.tsx).

## Étapes

- [x] Écrire Al Qods (postes, consultations, ST, DA/BL, mois, discriminants).
- [x] Écrire ce que la STE attend (Études, Catalogue, Achats, Chantiers, Marchés ; Finance hors).
- [x] Découper 221–226. Pause `finition-parcours`.

## Preuves attendues

- Documents versionnés. Une question : ST sur nœud sans planning.

## Question

Le coffrage (poste 2.3) peut-il avoir un **contrat ST dès le palier 1**, accroché au nœud, sans aucune activité ?

- **A** — Oui. La DA matière et la ST suivent la même règle : le besoin naît sur le chantier / le nœud. L'attachement ST reste une suite. Recommandé — sinon Al Qods mois 1 est injouable.
- **B** — Non. On attend `planning-activites`. Le coffrage n'existe dans Sektor qu'après un Gantt.

Recommandé : **A**.

## Journal

```
27/08 22:43  posée
27/08 22:43  status → doing
27/08 22:55  scénario + contrat + canvas + tasks 221–226
27/08 22:47  status → done-agent
27/08 23:43  toi · approuvée → done-me
```

## Rapport de livraison

Les objets DA, BL, documents, ST, marché existent en silo. Le cockpit ne les enchaîne pas. La preuve QA récente s'arrêtait à des KPI et un seed déjà converti.

Al Qods : 180 m³ béton consulté, 25 t acier, coffrage et étanchéité ST, nœud interne installation, livraison directe, BL partiel, attachement lu, situation, réception provisoire. Rôles conducteur / chef / magasinier / daf.

Décidé seul : magasin facultatif (gel déjà) ; documents OS/plan/PV/BL rentrent au palier 1 ; `finition-parcours` en pause ; finance hors.

Écart : 224 (ST) dépend de A. Si B, 224 se bloque.

