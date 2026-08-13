# CH-00-INIT — contrat fichiers (raster-src)

**Type :** `INIT`  
**BC :** work  
**Raster :** sous-lot `RAS-11`

Première vérité : l’orchestrateur lit `raster-src`, pas `pact/` ; sprint = champ task ; arbre = `parent:`.

## Preuves (DoD INIT)

1. SPEC `pact/work/SPEC.md` créée (et carte app).
2. Canvas `ux/work-wireframe.canvas.tsx` — 3 vues + fallback manuel.
3. e2e `raster/e2e/work/scan-raster-src.test.mjs` — scan peers `raster-src`, ignore `pact/`.

## Hors CH

Move de `products/raster/web` → `raster/web` (autre Change / MIG).
