---

id: SEKTOR-83
status: done-me
context: nafura
type: tech
priority: P0
assignee: agent
gate: none
sprint: 2026-W33
---

# Figer le mapping socle vs dossiers actuels

> Une liste de fichiers : socle, domaine existant, ou platform (on n’y touche pas). Rien ne bouge avant ce mapping.

## Étapes

- [x] Écrire `stabiliser-sources/MAPPING.md` : chaque zone `app/` web et `backend/app/src` → `web/socle` | `web/<domaine>` | `backend/socle` | `backend/modules/<nom>` | `app` (boot) | `laisser` (platform)
- [x] Web socle : `config/`, `shell/`, `onboarding/`, `invitations/`, `integrations/`, bootstrap, admin routes, dashboard, shared, styles
- [x] Web domaines = dossiers déjà là : `pages/<x>/` fusionne dans `<x>/` — **aucun renommage**
- [x] Backend socle : onboarding, invitations, cursor-auth, print identity, AI tenant, demo seed, registries sektor.ai / search
- [x] Adapters `etudes/` et `catalogue/` dans `app/` → leur module Gradle
- [x] Interdit : inventer un BC, fusionner item/stock/catalogue, déplacer anatomy

## Preuve de fin

`sektor/raster-src/lots/stabiliser-sources/MAPPING.md` est la SSOT. `gate: me` retiré — la cible était déjà tranchée (kernel app vs dossiers actuels).

## Journal

```
14/08 11:05  promote  lot stabiliser-sources · Raster seul · Pact après
14/08 11:10  décision  gate:me levé — mapping = application de la vision déjà validée, pas une frontière produit
14/08 11:12  tsk1  MAPPING.md écrit (web socle/domaines, backend socle/modules/app)
```

## Rapport de livraison

ce qui a changé      `MAPPING.md` : web `app/socle` + fusion pages→domaines ; backend `modules/socle` ; app = boot
critères prouvés     n/a (tech Raster seul) — SSOT fichier
décidé seul          `pages/dashboard` et `pages/administration` → socle ; `shared/` → socle ; search/AI registries → socle ; `pilotage-analyses` garde son nom
écarts / dette       uom doublons et inventory×catalogue hors lot
