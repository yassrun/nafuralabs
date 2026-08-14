---

id: SEKTOR-93
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-92]
---

# Web : socle + preuve build

> approbations, analytics, pilotage* → `app/socle/`. Arbre web = arbre backend. `npm run build:dev` VERT.

## Étapes

- [x] `app/approbations/` → `app/socle/approbations/`
- [x] `app/analytics/` `app/pilotage/` `app/pilotage-analyses/` → `app/socle/`
- [x] Vérifier : pas de dossier `partner/` ; fournisseurs dans `achats/`, clients dans `ventes/`
- [x] Liste `app/` = socle catalogue etudes chantiers marches achats ventes finance rh hse
- [x] `cd sektor/sources/web && npm run build:dev` VERT

## Preuve de fin

Même liste de dossiers que `backend/` (hors `app/` boot). build:dev VERT.

## Journal

```
14/08/2026
tsk1 move approbations analytics pilotage pilotage-analyses → app/socle/
tsk2 retarget @app/{approbations,analytics,pilotage,pilotage-analyses} → @app/socle/...
tsk3 erp.routes.generated.ts + shell relatives ; pilotage.routes ../pilotage-analyses reste valide (siblings sous socle)
tsk4 pilotage/services : +1 ../ vers chantiers/marches/achats ; ../../socle/dashboard → ../../dashboard
tsk5 vérif partner absent, achats/fournisseurs et ventes/clients présents
tsk6 npm run build:dev VERT (41.5s, warnings préexistants hors périmètre)
```

## Rapport de livraison

### Ce qui a changé
- `approbations/`, `analytics/`, `pilotage/`, `pilotage-analyses/` sous `app/socle/`.
- URLs `approbations`, `analytics`, `pilotage`, `pilotage-analyses` inchangées.
- `ARCHITECTURE.md` : domaines listés, plus d’`inventory/` sibling.

### Critères prouvés
- `ls app/` = `achats catalogue chantiers etudes finance hse marches rh socle ventes`
- pas de `partner/` ; `achats/fournisseurs/` et `ventes/clients/` présents
- `npm run build:dev` VERT

### Décidé seul
- Relatifs `pilotage` → autres domaines : un `../` de plus (profondeur socle). Relatif vers dashboard : `../../dashboard` (déjà dans socle).

### Écarts
- Aucun. Warnings NG8102/NG8011/TS-998113 préexistants, hors lot.
