# CH-01-EVOL — agents et arbre dérivé

**Type :** `EVOL`
**Cible :** BC `work`
**Qualification :** la SPEC ne parlait ni d'agents ni de dérivation d'arbre — elle était **muette**, donc `EVOL` et non `CORRECTION`.

**Politiques applicables :** `POL-FICHIER-SSOT` · `POL-VUES-GENEREES`

## Pourquoi

Quatre agents interviennent sur une task et rien ne disait qui fait quoi. Et l'arbre reposait sur un champ `parent:` recopié à la main — donc un lien qui peut mentir.

## Aujourd'hui

`kind:` et `type:` coexistent avec une collision documentée (`kind: spec` ≠ `type: spec`). Les chapeaux sont des tickets qui stockent un statut calculable. `parent:` porte l'arbre.

## Attendu

- `type:` **spec | feature | bug | tech | physical | qa** — un seul axe, `kind` supprimé
- `agent_type` dérivé de `type`, couple incohérent **refusé**
- Lot et sous-lot = **dossiers** ; leur état est dérivé
- L'arbre vient du **chemin** ; `parent:` supprimé
- Handoff : spec → exec → spec (constat d'écart) → qa → `done-agent`

## Critères d'acceptation (gelés)

- **AC-1** `agent_type` absent est dérivé de `type` ; un couple incohérent lève une erreur.
- **AC-2** `tech` existe et mappe sur `exec`.
- **AC-3** L'arbre d'une task se déduit de son chemin, à plat comme en sous-lot.
- **AC-4** L'INDEX ne porte plus ni `kind` ni `parent`, et porte `lot` et `souslot`.
- **AC-5** Un sous-lot s'affiche `✓` ssi toutes ses tasks live sont `done-agent`.
- **AC-6** L'exec ne pose jamais `done-agent` sur une feature ou un bug.

## Preuves attendues

- `raster/e2e/work/scan-raster-src.test.mjs` — `AC-1` à `AC-4`
- e2e à écrire — `AC-5`
- Parcours UI : filtre spec / exec / qa, CTA Lancer sur le sous-lot

Canvas : [`../ux/work-wireframe.canvas.tsx`](../ux/work-wireframe.canvas.tsx)
