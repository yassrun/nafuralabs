# CH-00-INIT — contrat fichiers

**Type :** `EVOL` (forme `INIT` — première vérité de `work`)
**Cible :** BC `work`
**Qualification :** aucun contrat écrit ; les tickets vivaient sous `docs/specs/lots` sans règle de localisation.

## Pourquoi

Les tickets étaient dispersés et l'orchestrateur ne savait pas quoi scanner. Sans règle de localisation, aucune vue n'est fiable.

## Aujourd'hui

Rien de spécifié.

## Attendu

Un seul scan : `**/raster-src/lots/**/tasks/*.md`. `pact/` n'est jamais lu. Le sprint est un champ sur la task.

## Critères d'acceptation (gelés)

- **AC-1** Le scan trouve les tasks de tout projet ayant `raster-src/lots`, à la racine comme sous `products/`.
- **AC-2** Aucun fichier sous `pact/` n'entre jamais dans le scan.
- **AC-3** Aucun fichier sous `docs/specs/` n'entre dans le scan.
- **AC-4** Un dossier sans `raster-src/lots` n'est pas un projet Raster.

## Preuves attendues

`raster/e2e/work/scan-raster-src.test.mjs` — un test par critère.

## Hors périmètre

Le déplacement de `raster/web` → `raster/web`. Autre Change.

Canvas : [`../ux/work-wireframe.canvas.tsx`](../ux/work-wireframe.canvas.tsx)
