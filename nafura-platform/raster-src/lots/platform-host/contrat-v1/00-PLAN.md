# Contrat v1 — un format pour app et BC

> `app.nafura.json` et `bc.manifest.json` deviennent deux `kind` de `NafuraManifest`, validés par la plateforme. Base de `host-v1`.

Contrat : [`CONTRAT.md`](CONTRAT.md).
Lot : [`../LOT.md`](../LOT.md).

## Intention

Aujourd’hui la config d’une app est éclatée en TypeScript (`registerApplicationConfig`, `provideAppShell`, tokens de modules) et deux formats de manifeste coexistent. Quand ce sous-lot est livré, une app et ses BCs se décrivent en JSON, dans un format unique, et la plateforme sait dire pourquoi une combinaison est invalide.

## Périmètre

Inclus :

- Extension des types `NafuraManifest` (`application`, `business-context`).
- Projections pures `spec.shell` → `AppShellFeatureConfig` et `spec.runtime` → `ApplicationConfig`.
- Nouveaux codes du validateur (AC-4) + tests.
- Schémas JSON app / BC.
- Réécriture des deux exemples sandbox.

Exclus :

- Lire les fichiers au démarrage d’une app (c’est `host-v1`).
- Seeder les rôles côté backend (c’est `bc-v1`).
- Manifeste côté Java : le backend lira le même JSON en `bc-v1`.
- Toute modification de Sektor.

## Approche

Étendre, ne pas remplacer : `NafuraManifest` et son validateur sont déjà la preuve existante. Les projections sont des fonctions pures, testées sans Angular. Le schéma JSON est écrit à la main à partir des types et vérifié en test par les exemples.

Risque : sur-modéliser le shell. Tranché : `spec.shell` reprend `AppShellFeatureConfig` champ à champ, sans navigation ni routes.

## Tasks

| # | Task | agent_type | blocked_by |
|---|---|---|---|
| 1 | Types `application` / `business-context` + réécriture des exemples | exec | — |
| 2 | Validateur : codes AC-4 + tests | exec | 1 |
| 3 | Projections shell / runtime + tests | exec | 1 |
| 4 | Schémas JSON + test exemples ↔ schéma | exec | 1 |

## Validation technique

Depuis `nafura-platform/sources/web` : `npm run architecture:check`.

| Preuve | Couvre |
|--------|--------|
| Exemples sandbox réécrits validés | AC-1, AC-5 |
| Un test par code d’issue AC-4 (cas valide + cas rejeté) | AC-4 |
| Projection de l’exemple == config `provideAppShell` actuelle du sandbox (hors navigation) | AC-2, AC-3 |
| Tests existants `SANDBOX_MANIFEST` + capabilities inchangés et verts | AC-7 |

## Blocages extérieurs

Aucun.
