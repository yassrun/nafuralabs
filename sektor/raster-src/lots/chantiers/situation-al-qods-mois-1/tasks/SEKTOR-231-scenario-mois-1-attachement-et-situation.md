---
id: SEKTOR-231
status: review
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: me
tags: [chantiers, situation, attachement]
---

# Scénario mois 1 attachement et situation

> Figer Al Qods septembre : avancement → attachement signé → situation n°1 (RG/avance), sans marché.

Contrat : [`../CONTRAT.md`](../CONTRAT.md) AC-M1..M12 · Scénario : [`../SCENARIO.md`](../SCENARIO.md) · UX : [`../ux/situation-al-qods-mois-1-wireframe.canvas.tsx`](../ux/situation-al-qods-mois-1-wireframe.canvas.tsx)

## Étapes

- [x] Écrire `00-PLAN.md`, `SCENARIO.md`, `CONTRAT.md`, `FIXTURES.md`.
- [x] Wireframe fin de mois (attachement lu, situation n1, cockpit lendemain).
- [x] Découper tasks 232–235 et preuves e2e nommées.
- [x] Trancher : mois 1 = RG + avance seulement (pas pénalités / RAS ce cycle).

## Preuves attendues

- Plan + contrat + scénario cohérents avec `vie-de-chantier` acte 2.d.
- `node raster/t.mjs check` vert.

## Journal

```
28/08  posée
28/08  spec livrée → review (gate me)
28/08 11:25  status → review
```

## Rapport de livraison

Sous-lot `situation-al-qods-mois-1` créé. Hérite des contrats voisins `avancement-et-attachement` et `situation-et-retenues` en tranche scénarisée. Exec 232/233/234 parallélisable après approbation.
