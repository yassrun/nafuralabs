---

id: SEKTOR-85
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
blocked_by: [SEKTOR-84]
---

# Un arbre web par domaine actuel

> Plus de `app/pages/`. Chaque domaine a un dossier, nom identique à aujourd’hui. Pas de fusion item/stock/catalogue.

## Étapes

- [x] Fusionner `app/pages/<domaine>/` dans `app/<domaine>/` (etudes, chantiers, inventory, achats, ventes, finance, rh, hse, marches, catalogue, approbations, analytics / pilotage selon mapping)
- [x] Retargeter `erp.routes.generated.ts` et les `*.routes.ts` — chemins d’import seulement
- [x] Supprimer `app/pages/` une fois vide
- [x] Doublons uom / unit-of-measures : **ne pas fusionner** dans cette task (dette, noter dans le rapport)

## Preuve de fin

Plus de `app/pages/`. `npm run build:dev` encore possible après SEKTOR-86. Aucun dossier métier inventé.

## Journal

```
14/08 11:35  tsk1  merge-mv pages/<d> → app/<d> (catalogue + pilotage-analyses créés) ; pages/ supprimé
14/08 11:36  tsk2  retarget @app/pages/ → @app/ + relatives (erp.routes, inventory.routes, onboarding-chantier)
14/08 11:36  tsk3  collision unique hse/models/index.ts : concaténation (types incidents + DUER/PPSPS)
```

## Rapport de livraison

ce qui a changé      plus de `app/pages/` ; un dossier par domaine actuel + `app/catalogue/` + `app/pilotage-analyses/` ; routes retargetées
critères prouvés     n/a (tech) — arbre = socle + domaines ; inventory/catalogue et catalogue restent distincts
décidé seul          fusion des deux `hse/models/index.ts` par concaténation (zéro collision fichier ailleurs)
écarts / dette       uom × unit-of-measures × uo-mcategories × uom-categories non fusionnés ; inventory × catalogue non fusionnés
