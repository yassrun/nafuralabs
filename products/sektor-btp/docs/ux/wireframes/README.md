# Wireframes Canvas (Sektor BTP)

Sources versionnées des Cursor Canvas UX (méthode principale — voir [`../METHODE-CANVAS-WIREFRAMES.md`](../METHODE-CANVAS-WIREFRAMES.md)).

## Pourquoi deux emplacements

| Emplacement | Rôle |
|-------------|------|
| **Ce dossier** (`docs/ux/wireframes/`) | **Source de vérité Git** — revue, historique, PR |
| `~/.cursor/projects/<workspace>/canvases/` | **Preview live** dans Cursor (seul chemin détecté par l’IDE) |

Les fichiers `*.canvas.data.json` (état UI local) **ne sont pas** versionnés.

## Workflow

1. Itérer le wireframe dans Cursor (preview) → fichier sous `canvases/`.
2. Avant commit / fin de session : **copier** le `.canvas.tsx` ici (même nom).
3. Commit le fichier sous `docs/ux/wireframes/`.
4. Pour reprendre sur une autre machine : copier depuis ce dossier vers `canvases/` pour rouvrir la preview.

```powershell
# Depuis la racine monorepo — sync preview → repo
Copy-Item "$env:USERPROFILE\.cursor\projects\c-nf-nafuralabs\canvases\chantier-create-wireframe.canvas.tsx" `
  "products\sektor-btp\docs\ux\wireframes\" -Force

# Repo → preview
Copy-Item "products\sektor-btp\docs\ux\wireframes\chantier-create-wireframe.canvas.tsx" `
  "$env:USERPROFILE\.cursor\projects\c-nf-nafuralabs\canvases\" -Force
```

## Inventaire

| Fichier | Sujet |
|---------|--------|
| `etude-decompo-wireframe.canvas.tsx` | Chiffrage poste (tree → drawer) — validé |
| `etude-ao-unify-wireframe.canvas.tsx` | Unification AO + étude + pièces |
| `etude-data-lifecycle.canvas.tsx` | Cycle de vie données étude |
| `chantier-create-wireframe.canvas.tsx` | Wizard marché + chantier (chaînage aval) |
