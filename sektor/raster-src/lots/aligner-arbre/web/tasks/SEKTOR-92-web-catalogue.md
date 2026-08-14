---

id: SEKTOR-92
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
---

# Web : tout le référentiel sous app/catalogue/

> `inventory/` + console `catalogue/` + `etudes/bibliotheque-prix` → `app/catalogue/`. Plus d’`inventory/`.

## Étapes

- [x] Fusionner `app/inventory/` dans `app/catalogue/`
- [x] La console déjà sous `app/catalogue/` reste, un seul arbre
- [x] `app/etudes/bibliotheque-prix/` → `app/catalogue/` (routes retarget ; etudes consomme)
- [x] Retarget imports `@app/inventory` et routes générées
- [x] Supprimer `app/inventory/` vide
- [x] Doublons uom : les emmener dans catalogue, **ne pas** fusionner les 4 dossiers dans cette task (dette notée au rapport si encore là)

## Preuve de fin

Plus d’`app/inventory/`. Plus de `etudes/bibliotheque-prix/`. Un `app/catalogue/`.

## Journal

```
14/08/2026
tsk1 flatten inventory/catalogue/{articles,item-prices,items,materiel} → app/catalogue/
tsk2 merge inventory/services → catalogue/services (0 clash avec catalogue-api.service.ts)
tsk3 siblings → catalogue/ ; clash materiel (GMAO) vs materiel (fiche catalogue) → incoming nesté materiel-parc
tsk4 etudes/bibliotheque-prix → catalogue/bibliotheque-prix ; route URL etudes/bibliotheque-prix dans catalogue.routes
tsk5 retarget @app/inventory → @app/catalogue (+ flatten @app/inventory/catalogue/X → @app/catalogue/X) ; erp.routes.generated.ts filesystem
tsk6 delete app/inventory/ et app/etudes/bibliotheque-prix/
```

## Rapport de livraison

### Ce qui a changé
- Un seul arbre `app/catalogue/` : console existante + articles/items/item-prices/materiel (flatten) + stock/mouvements/config/GMAO + bibliothèque-prix.
- `catalogue.routes.ts` exporte `CATALOGUE_ROUTES` (console, lazy `/catalogue`) et `INVENTORY_BTP_ROUTES` (spread ERP, URLs `inventory/...` et `etudes/bibliotheque-prix` inchangées).
- etudes ne possède plus le dossier ni le `loadChildren` bibliothèque-prix.

### Critères prouvés
- `app/inventory/` absent.
- `app/etudes/bibliotheque-prix/` absent.
- Un `app/catalogue/`.
- Aucun import TS `@app/inventory` ni filesystem `.../inventory/` restant sous `sektor/sources/web` (hors i18n keys / URL router).

### Décidé seul
- Clash `inventory/materiel/` (parc/GMAO) vs flatten `inventory/catalogue/materiel/` (fiche) → dossier GMAO nommé `materiel-parc`. URLs `materiel/parc` inchangées.
- `CATALOGUE_ROUTES` reste la console seule (lazy `path: 'catalogue'`) pour ne pas nicher les routes inventory sous `/catalogue/...`.

### Écarts
- Doublons uom encore présents sous `catalogue/configuration/` : `uom/`, `unit-of-measures/`, `uo-mcategories/`, `uom-categories/`. Non fusionnés (consigne).
- Compile reporté à SEKTOR-93 (`build:dev`).
