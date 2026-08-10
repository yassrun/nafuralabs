# Méthode UX Nafura — Canvas wireframes

**Statut :** figée (2026-08) — méthode **principale** de design UX produit.  
**Outil :** Cursor Canvas (`.canvas.tsx`), pas Figma comme source de vérité.

## Source unique

**Git SSOT** = UX de l’epic feature :

```
products/<app>/docs/specs/epics/<feature-slug>/ux/
  ├── <name>-wireframe.canvas.tsx   # canvas (source de vérité)
  └── notes.md                      # décisions WIP optionnelles
```

Le `00-PLAN.md` de l’epic §6 **pointe** vers ces fichiers (pas vers `docs/ux/wireframes/`).

## Preview live (Cursor)

L’IDE ne détecte les canvas que sous :

`~/.cursor/projects/<workspace>/canvases/*.canvas.tsx`

| Emplacement | Rôle |
|-------------|------|
| `epics/<slug>/ux/*.canvas.tsx` | **Source de vérité Git** |
| `~/.cursor/…/canvases/` | Preview IDE seulement (copie) |

Ne pas versionner les `*.canvas.data.json`.

### Sync

```powershell
# Repo (epic) → preview
Copy-Item "products\sektor-btp\docs\specs\epics\_archive\referentiel-catalogue-sektor\ux\uom-conversion-wireframe.canvas.tsx" `
  "$env:USERPROFILE\.cursor\projects\c-nf-nafuralabs\canvases\" -Force

# Preview → repo (après itération)
Copy-Item "$env:USERPROFILE\.cursor\projects\c-nf-nafuralabs\canvases\uom-conversion-wireframe.canvas.tsx" `
  "products\sektor-btp\docs\specs\epics\_archive\referentiel-catalogue-sektor\ux\" -Force
```

## Processus

```
Besoin UX → canvas dans epics/<slug>/ux/
         → sync canvases/ (preview)
         → revue / validation produit
         → PLAN §6 + ticket PM référencent le chemin epic
         → plan d’impl → code
```

## Règles de contenu

| Inclure | Éviter |
|---------|--------|
| Structure, hiérarchie, actions | Polish pixel / branding lourd |
| Multi-états (vide, mode A/B, dirty) | Un seul screenshot figé |
| AI + fallback manuel visible | Parcours IA-only |
| Décisions UX écrites sous le wireframe | Décisions orales non capturées |

## Référence canonique

Canvas validé : **etude-decompo-wireframe** —  
`docs/specs/epics/_archive/etude-prix-unifiee/ux/etude-decompo-wireframe.canvas.tsx`

## Agents

Règle Cursor : `.cursor/rules/ux-canvas-wireframes.mdc` (`alwaysApply`).  
Convention specs : [`docs/specs/README.md`](../../../../docs/specs/README.md).

## Legacy

`docs/ux/wireframes/` n’est **plus** la SSOT — voir README de ce dossier (redirect).
